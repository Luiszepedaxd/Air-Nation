// Lo que se filtra: los patrones que cortan un turno (inyección, fuera de tema,
// saludo, despedida, identidad) y la limpieza de DATOS, del historial y de la respuesta.
const { COPY } = require("./config");

const INJECTION_RE =
  /ignora(?:r)?\s+(?:las\s+|tus\s+)?(?:instrucciones|reglas|prompt)|ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|rules)|system\s*prompt|revela(?:r)?\s+(?:tu\s+)?(?:prompt|instrucciones|configuraci[oó]n|sistema)|olvida\s+(?:todo|tus\s+instrucciones)|act[uú]a\s+como|you\s+are\s+now|jailbreak|cambia(?:r)?\s+(?:de\s+)?(?:persona|personaje|rol)|developer\s+mode|<\s*system\s*>|j9k-canary/i;

const OFFTOPIC_RE =
  /\b(tarea|homework|ensayo)\b|\b(python|javascript|typescript)\b|\b(escr[ií]beme|escribe)\b.{0,40}\b(c[oó]digo|funci[oó]n|script|programa)\b|\b(elecciones|partido pol[ií]tico|campaña electoral)\b|\bpresidente de (?:m[eé]xico|la rep[uú]blica|estados unidos)\b|\b(chiste|poema|receta de cocina)\b|\b(netflix|spotify|chatgpt)\b|\bcapital de\b/i;

const GREETING_RE =
  /^(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|hey|qui[uú]bole|qu[eé] tal)[!.?\s]*$/i;

const FAREWELL_RE =
  /\b(ser[ií]a todo|eso es todo|eso ser[ií]a todo|adi[oó]s|hasta luego|nos vemos|me despido|ya me voy)\b|\b(ser[ií]a|es)\s+todo\s+por\s+hoy\b/i;

const IDENTITY_RE =
  /\b(qui[eé]n eres|qu[eé] eres|qu[eé] es joulie|para qu[eé] sirves|c[oó]mo puedes ayudar)\b/i;

// "¿Qué puedes hacer?" no es "¿quién eres?": se contesta con lo que sabe consultar.
const CAPABILITY_RE =
  /\bqu[eé] puedes hacer\b|\bqu[eé] sabes hacer\b|\ben qu[eé] (?:me )?(?:puedes|podr[ií]as) ayudar\b/i;

function scrubString(value, max = 280) {
  const parts = String(value).split(/(?<=[.!?\n])/);
  const kept = parts
    .filter((part) => part && !INJECTION_RE.test(part))
    .join("");
  return kept
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "")
    .replace(/https?:\/\/wa\.me\/\d+/gi, "")
    .replace(/\b\d{10,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function stripWebJunk(text) {
  return String(text || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "");
}

function guardReply(text) {
  const cleaned = stripWebJunk(text).trim();
  if (!cleaned) return COPY.noData;
  if (/j9k-canary|openrouter|sk-or-|sk-ant-|elevenlabs|supabase_service|system prompt/i.test(cleaned)) {
    return COPY.refusal;
  }
  return cleaned.slice(0, 500);
}

function sanitizeHistory(history, maxTurns, maxLen) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const item of history) {
    if (!item || (item.role !== "user" && item.role !== "assistant")) continue;
    if (typeof item.content !== "string") continue;
    const content = item.content.trim().slice(0, maxLen);
    if (!content || INJECTION_RE.test(content)) continue;
    out.push({ role: item.role, content });
  }
  return out.slice(-maxTurns);
}

module.exports = {
  CAPABILITY_RE,
  FAREWELL_RE,
  GREETING_RE,
  IDENTITY_RE,
  INJECTION_RE,
  OFFTOPIC_RE,
  guardReply,
  sanitizeHistory,
  scrubString,
  stripWebJunk,
};
