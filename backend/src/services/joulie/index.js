/**
 * JOULIE: asistente de AirNation. La llave de OpenRouter es OPENROUTER_API_KEY
 * (la misma del validador de credenciales). La voz usa ELEVENLABS_API_KEY.
 * Ninguna de las dos sale al cliente.
 *
 * Esta carpeta es la misma asistente de antes, partida por responsabilidad:
 *   config      topes, textos fijos y variables de entorno
 *   guards      lo que se corta y lo que se limpia
 *   text        normalizar y partir en palabras lo que dijo quien habla
 *   schema      el mapa de la base (ENTITIES) y las columnas privadas
 *   pages       las URLs públicas de airnation.online
 *   time        horas, fechas y horarios dichos en hora de Ciudad de México
 *   context     DATOS: cada fila convertida en ficha corta y etiquetada
 *   intent      qué tabla pide la pregunta
 *   web-search  cuándo se busca en internet y con qué cupo
 *   match       cómo se filtran y ordenan las filas
 *   queries     lo que se le pregunta a Supabase
 *   limits      cupos, minutos de voz, interruptor y exención de admin
 *   session     la sesión firmada de una llamada
 *   eleven      el protocolo con ElevenLabs
 *   openrouter  la llamada al modelo
 *   prompt      el system prompt
 *   chat        un turno completo
 *   voice       la voz y el custom LLM
 *
 * Esto es lo único que ve el resto del backend.
 */
const { COPY, DEFAULTS, resolveConfig } = require("./config");
const { ENTITIES } = require("./schema");
const { nameTokens, expandName } = require("./text");
const { shapeContext } = require("./context");
const { wantsWebOptions, createWebBudget } = require("./web-search");
const { createLimiter, createVoiceBudget } = require("./limits");
const { signSession, verifySession } = require("./session");
const { DEFAULT_ELEVENLABS_VOICE_ID, voiceId } = require("./eleven");
const { buildChatBody } = require("./openrouter");
const { handleJoulie, streamJoulie } = require("./chat");
const { mintConversation, runCustomLlm } = require("./voice");

module.exports = {
  COPY,
  DEFAULTS,
  DEFAULT_ELEVENLABS_VOICE_ID,
  ENTITIES,
  buildChatBody,
  createLimiter,
  createVoiceBudget,
  createWebBudget,
  expandName,
  handleJoulie,
  mintConversation,
  nameTokens,
  resolveConfig,
  runCustomLlm,
  shapeContext,
  signSession,
  streamJoulie,
  verifySession,
  voiceId,
  wantsWebOptions,
};
