// Cuándo le conviene pensar antes de hablar. Decide con lo que el turno ya
// averiguó (búsqueda, consejo, foco, seguimiento, forma de la pregunta), nunca
// con una lista de temas. Razonar cuesta latencia y tokens: por omisión, no.
const { plain } = require("./text");

// Una pregunta de varias partes: larga, o con varias cláusulas o alternativas.
function tangled(text) {
  const words = plain(text).split(/\s+/).filter(Boolean).length;
  const parts = (plain(text).match(/[?,;]|\bo\b|\by\b/g) || []).length;
  return words >= 14 || parts >= 3;
}

function wantsReasoning(signals) {
  const { web, advice, hollow, foco, text } = signals || {};
  // Juntar internet con lo de la app, u orientar, no es una consulta: es pensar.
  if (web || advice || hollow) return true;
  // Un foco claro es una consulta de una tabla: se contesta directo.
  if (foco) return false;
  // ponytail: un seguimiento («¿y ahí?») no piensa: con historial casi todo turno
  // lo parece y la voz pagaría la latencia. Si hace falta, la señal va aquí.
  return tangled(text || "");
}

/**
 * El plan del turno: cuántos tokens de razonamiento caben. 0 es apagado, y es
 * lo que se manda explícitamente cuando no toca pensar. El presupuesto hablado
 * no se toca: el razonamiento se suma aparte al max_tokens (openrouter.js),
 * porque OpenRouter cuenta razonamiento y respuesta contra el mismo tope.
 */
function reasoningPlan(signals, cfg) {
  const budget = Math.max(0, Math.floor(Number(cfg && cfg.reasoningTokens) || 0));
  const on = budget > 0 && wantsReasoning(signals);
  return { on, tokens: on ? budget : 0 };
}

module.exports = {
  reasoningPlan,
};
