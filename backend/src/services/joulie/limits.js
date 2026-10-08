// Quién puede hablar con JOULIE y cuánto: cupo por minuto, tope diario,
// minutos de voz, el interruptor general y la exención de admin.
const { DEFAULTS } = require("./config");
const { plain } = require("./text");
const { dayKey } = require("./time");

/**
 * ponytail: cupo en memoria de un solo proceso. Varias réplicas de Railway
 * pueden pasarse del tope. Para compartirlo haría falta un almacén común.
 */
function createLimiter() {
  const hits = new Map();
  const daily = new Map();

  function prune(now) {
    if (hits.size < 4000 && daily.size < 8000) return;
    const minuteAgo = now - 60_000;
    for (const [key, arr] of hits) {
      const keep = arr.filter((t) => t > minuteAgo);
      if (keep.length) hits.set(key, keep);
      else hits.delete(key);
    }
    const today = dayKey(now);
    for (const key of daily.keys()) {
      if (!key.endsWith("|" + today)) daily.delete(key);
    }
  }

  function allow({ userId, ip, now, perMinute, dailyCap }) {
    const ts = now || Date.now();
    prune(ts);
    const minuteAgo = ts - 60_000;
    const keys = [`u:${userId || "anon"}`, `ip:${ip || "unknown"}`];
    const windows = keys.map((key) => (hits.get(key) || []).filter((t) => t > minuteAgo));
    if (windows.some((window) => window.length >= perMinute)) return false;
    const dkey = `${userId || "anon"}|${dayKey(ts)}`;
    const used = daily.get(dkey) || 0;
    if (used >= dailyCap) return false;
    windows.forEach((window, i) => {
      window.push(ts);
      hits.set(keys[i], window);
    });
    daily.set(dkey, used + 1);
    return true;
  }

  return { allow };
}

function createVoiceBudget() {
  const used = new Map();
  const open = new Map();

  function bucket(userId, now) {
    return `${userId}|${dayKey(now)}`;
  }

  function settle(now) {
    for (const [token, row] of open) {
      if (now - row.mark > DEFAULTS.sessionTtlMs) open.delete(token);
    }
  }

  function liveMs(userId, now) {
    const ts = now || Date.now();
    settle(ts);
    let extra = 0;
    for (const row of open.values()) {
      if (row.userId === userId) extra += Math.max(0, ts - row.mark);
    }
    return (used.get(bucket(userId, ts)) || 0) + extra;
  }

  function canStart(userId, now, capMinutes) {
    return liveMs(userId, now) < capMinutes * 60_000;
  }

  function begin(token, userId, now) {
    open.set(token, { userId: String(userId || ""), mark: now || Date.now() });
  }

  function touch(token, userId, now, capMinutes) {
    const ts = now || Date.now();
    const cap = (capMinutes || DEFAULTS.dailyMinutes) * 60_000;
    let row = open.get(token);
    if (!row) {
      row = { userId: String(userId || ""), mark: ts };
      open.set(token, row);
    }
    const delta = Math.max(0, ts - row.mark);
    row.mark = ts;
    const id = bucket(row.userId, ts);
    const next = (used.get(id) || 0) + delta;
    if (next > cap) {
      used.set(id, cap);
      return false;
    }
    used.set(id, next);
    return true;
  }

  return { canStart, begin, touch, liveMs };
}

// ponytail: ElevenLabs reintenta y manda parciales del mismo turno. Cuenta una vez
// por sesión y frase durante 20 s, en memoria de este proceso. El cupo de minutos
// diarios sigue siendo el freno de costo. Una cadena de prefijos no desliza la ventana.
const voiceRecent = new Map();

const VOICE_DEDUPE_MS = 20_000;

function voiceShouldCharge(sessionKey, text, now) {
  const norm = plain(text).replace(/[^a-z0-9]+/g, " ").trim();
  if (!norm) return false;
  const prev = voiceRecent.get(sessionKey);
  if (prev && now - prev.at <= VOICE_DEDUPE_MS && (norm === prev.norm || norm.startsWith(prev.norm) || prev.norm.startsWith(norm))) {
    if (norm.length >= prev.norm.length) voiceRecent.set(sessionKey, { norm, at: prev.at });
    return false;
  }
  voiceRecent.set(sessionKey, { norm, at: now });
  if (voiceRecent.size > 2000) {
    for (const [key, row] of voiceRecent) {
      if (now - row.at > VOICE_DEDUPE_MS) voiceRecent.delete(key);
    }
  }
  return true;
}

// ponytail: el rol no cambia en medio de una llamada. 60 s evita pegarle a users en cada turno.
const adminCache = new Map();

async function isAppAdmin(supabase, userId) {
  const id = String(userId || "");
  if (!id || !supabase) return false;
  const hit = adminCache.get(id);
  if (hit && Date.now() - hit.at < 60_000) return hit.value;
  try {
    const { data, error } = await supabase.from("users").select("app_role").eq("id", id).maybeSingle();
    const value = !error && !!data && data.app_role === "admin";
    adminCache.set(id, { value, at: Date.now() });
    return value;
  } catch {
    return false;
  }
}

// ponytail: interruptor cacheado 30 s por proceso para ahorrar un viaje a Supabase
// en cada turno de voz. Apagar Joulie tarda hasta 30 s en surtir efecto.
const enabledCache = new WeakMap();

async function readEnabled(supabase, enabled) {
  if (typeof enabled === "boolean") return enabled;
  if (!supabase) return true;
  const hit = enabledCache.get(supabase);
  if (hit && Date.now() - hit.at < 30_000) return hit.value;
  try {
    const { data, error } = await supabase
      .from("joulie_config")
      .select("enabled")
      .eq("id", "singleton")
      .maybeSingle();
    if (error || !data || typeof data.enabled !== "boolean") return true;
    enabledCache.set(supabase, { value: data.enabled, at: Date.now() });
    return data.enabled;
  } catch {
    return true;
  }
}

module.exports = {
  createLimiter,
  createVoiceBudget,
  isAppAdmin,
  readEnabled,
  voiceShouldCharge,
};
