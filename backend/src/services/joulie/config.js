// Los topes, los textos fijos y las variables de entorno de JOULIE. Nadie más lee process.env para configurarla.

const DEFAULTS = {
  model: "google/gemini-2.5-flash",
  maxTokens: 70,
  maxInput: 500,
  timeoutMs: 18000,
  perMinute: 8,
  dailyCap: 40,
  voicePerMinute: 30,
  voiceDailyCap: 120,
  dailyMinutes: 5,
  sessionTtlMs: 20 * 60 * 1000,
  historyTurns: 6,
  webSession: 3,
  webDaily: 8,
};

const COPY = {
  refusal: "Solo puedo ayudarte con airsoft dentro de AirNation.",
  noData: "No tengo ese dato en AirNation.",
  busy: "Ahora no puedo responder. Intenta de nuevo en un momento.",
  limited: "Llegaste al límite de preguntas por ahora. Intenta más tarde.",
  tooLong: "Ese mensaje es demasiado largo. Pregúntame algo más corto sobre airsoft en AirNation.",
  empty: "Escribe una pregunta sobre airsoft en AirNation.",
  hello:
    "Hola, soy Joulie. Estoy lista para ayudarte con eventos, réplicas, campos y equipos de airsoft en AirNation.",
  who:
    "Soy Joulie. Estoy lista para ayudarte con lo publicado en AirNation: eventos, réplicas, campos y equipos de airsoft.",
  bye: "Listo. Aquí te dejo.",
  can: "Puedo contarte los eventos, campos, equipos, réplicas y productos publicados en AirNation.",
  unavailable: "Joulie no está disponible por ahora.",
};

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function strEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") return fallback;
  return String(raw).trim();
}

function resolveConfig() {
  return {
    model: strEnv("JOULIE_MODEL", DEFAULTS.model),
    maxTokens: intEnv("JOULIE_MAX_OUTPUT_TOKENS", DEFAULTS.maxTokens),
    maxInput: intEnv("JOULIE_MAX_INPUT_CHARS", DEFAULTS.maxInput),
    timeoutMs: intEnv("JOULIE_TIMEOUT_MS", DEFAULTS.timeoutMs),
    perMinute: intEnv("JOULIE_RATE_PER_MIN", DEFAULTS.perMinute),
    dailyCap: intEnv("JOULIE_DAILY_CAP", DEFAULTS.dailyCap),
    voicePerMinute: intEnv("JOULIE_VOICE_RATE_PER_MIN", DEFAULTS.voicePerMinute),
    voiceDailyCap: intEnv("JOULIE_VOICE_DAILY_CAP", DEFAULTS.voiceDailyCap),
    dailyMinutes: intEnv("JOULIE_DAILY_MINUTES", DEFAULTS.dailyMinutes),
    sessionTtlMs: intEnv("JOULIE_SESSION_TTL_MS", DEFAULTS.sessionTtlMs),
    historyTurns: DEFAULTS.historyTurns,
    webSession: intEnv("JOULIE_WEB_SESSION", DEFAULTS.webSession),
    webDaily: intEnv("JOULIE_WEB_DAILY", DEFAULTS.webDaily),
  };
}

module.exports = {
  COPY,
  DEFAULTS,
  resolveConfig,
  strEnv,
};
