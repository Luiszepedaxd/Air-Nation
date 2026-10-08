// Qué está pidiendo la pregunta: la tabla que manda, la agenda, la ficha de un evento o consejo general.
const { nameTokens, plain } = require("./text");

function wantsAdvice(message) {
  return /\b(replica|replicas|aeg|gbb|gbbr|hpa|muelle|spring|gas|electrica|fps|joule|julios|mantenimiento|mejora|mejoras|upgrade|cqb|principiante|empezar|elegir|recomiend|seguridad|proteccion|gafas|mascara|milsim|speedsoft|chaleco)\b/.test(
    plain(message)
  );
}

// "próximos", "este fin de semana", "pronto" o "qué eventos hay" piden la agenda,
// aunque otra palabra haya coincidido con un equipo o un campo.
// La pregunta nombra campos: "campos", "sedes" o "dónde jugar".
function mentionsFields(message) {
  const text = plain(message);
  if (/\b(campos?|sedes?)\b/.test(text)) return true;
  return /\b(jugar|juego)\b/.test(text) && /\b(donde|puedo|pueden|hay|cerca)\b/.test(text);
}

// Un horario, una apertura o un cierre también son cosa de campos, aunque no los nombre.
function wantsFields(message) {
  return mentionsFields(message) || /\b(horarios?|abren?|cierran?)\b/.test(plain(message));
}

// La pregunta nombra la agenda: entonces no se cierra a una sola tabla.
function mentionsEvents(message) {
  return /\b(eventos?|operacion|torneos?)\b/.test(plain(message));
}

// "equipo" también es el equipo de protección: eso no son los equipos de la tabla.
function wantsTeams(message) {
  const text = plain(message);
  if (!/\b(equipos?|clan|clanes|escuadr\w+)\b/.test(text)) return false;
  return !/\b(proteccion|chaleco|gafas|mascara|replica|replicas|tactico|comprar)\b/.test(text);
}

/**
 * La tabla que manda: campos para dónde jugar y horarios, equipos para grupos.
 * Sin foco se consulta todo. Si la pregunta pide las dos, o también suena a
 * evento (la agenda tiene sus propios horarios), tampoco se cierra a una.
 */
function focusOf(message) {
  const fields = wantsFields(message);
  const teams = wantsTeams(message);
  if (fields === teams || mentionsEvents(message)) return undefined;
  return fields ? "campos" : "equipos";
}

function placeTokens(message) {
  const skip = new Set([
    "jugar", "juego", "puedo", "pueden", "cerca", "algun", "alguna",
    // Preguntar el horario no nombra un lugar: sin esto "abren" buscaría un campo así.
    "hora", "horas", "horario", "horarios", "abre", "abren", "cierra", "cierran",
  ]);
  return nameTokens(message).filter((word) => !skip.has(word));
}

function wantsEventSheet(message) {
  const text = plain(message);
  const named = mentionsEvents(message);
  if (wantsFields(message) && !named) return false;
  // "horario" de un campo no es la ficha del evento. "a qué hora empieza X" sí.
  if (!named && /\b(hora|horario|cronograma)\b/.test(text) && !/\bempiez/.test(text)) return false;
  return /\b(trata|trama|historia|hora|empiez|cuesta|precio|costo|boleto|entrada|donde|lugar|sede|regla|requisit|horario|cronograma|detalle|incluye|faccion|amenidad)\b/.test(
    text
  );
}

function wantsUpcoming(message) {
  const text = plain(message);
  return (
    /\b(proximos?|pronto|fin de semana|finde)\b/.test(text) ||
    /\b(que|cuales|cual)\b.{0,40}\beventos?\b/.test(text) ||
    /\beventos?\b.{0,24}\bhay\b/.test(text)
  );
}

// Para seguimientos como "¿dónde es?": busca con la pregunta, los nombres propios
// que JOULIE acaba de decir y la pregunta anterior, en ese orden.
function lookupText(text, history) {
  const recent = history.slice(-4).reverse();
  const said = recent
    .filter((turn) => turn.role === "assistant")
    .map((turn) => (turn.content.match(/[A-ZÁÉÍÓÚÑ][\p{L}\d]*(?:\s+[A-ZÁÉÍÓÚÑ\d][\p{L}\d]*)*/gu) || []).join(" "));
  const asked = recent.filter((turn) => turn.role === "user").map((turn) => turn.content);
  return [text, ...said, ...asked].join(" ");
}

// ¿La pregunta (o lo que ya se dijo en la conversación) nombra este registro?
// Basta una palabra propia del título, no el título completo.
function titleMentioned(message, title) {
  const text = plain(message);
  return plain(title || "")
    .split(/[^a-z0-9]+/)
    .some((word) => word.length >= 4 && text.includes(word));
}

module.exports = {
  focusOf,
  lookupText,
  mentionsFields,
  placeTokens,
  titleMentioned,
  wantsAdvice,
  wantsEventSheet,
  wantsTeams,
  wantsUpcoming,
};
