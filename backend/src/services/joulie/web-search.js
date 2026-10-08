// Cuándo se busca en internet y cuántas veces cabe hacerlo.
const { DEFAULTS } = require("./config");
const { plain } = require("./text");
const { dayKey } = require("./time");

function wantsBuy(message) {
  return /\b(comprar|compro|compra|comprando)\b/.test(plain(message));
}

// «¿con qué juego?» se responde con el escenario y tu_arsenal. Comprar sí busca.
function wantsUseReplica(message) {
  if (wantsBuy(message)) return false;
  const text = plain(message);
  if (/\b(mejora|mejoras|upgrade|upgrades)\b/.test(text)) return false;
  if (!/\b(replica|replicas|aeg|gbb|gbbr|hpa)\b/.test(text)) return false;
  return /\b(juego|jugar|uso|usar|llevo|llevar|ahi|recomiend)/.test(text);
}

// Opciones de compra, no la agenda ni los campos ni los equipos de AirNation.
function wantsWebOptions(message) {
  const text = plain(message);
  if (wantsUseReplica(message)) return false;
  if (/\b(eventos?|campos?|sedes?|torneos?|partidas?)\b/.test(text)) return false;
  if (/\bequipos?\b/.test(text) && !/\b(proteccion|chaleco|gafas|mascara|replica|tactico)\b/.test(text)) return false;
  const gear = /\b(replica|replicas|aeg|gbb|gbbr|hpa|muelle|spring|upgrade|upgrades|mejora|mejoras|cqb|gafas|mascara|mascaras|chaleco|proteccion|bateria|cargador|mira|hop)\b/.test(text);
  if (wantsBuy(message)) return true;
  const ask = /\b(recomiend\w*|opciones|opcion|conviene|suger\w*)\b/.test(text);
  if (ask && gear) return true;
  if (gear && /\b(mejora|mejoras|upgrade|upgrades)\b/.test(text) && /\b(que|cual|cuales)\b/.test(text)) return true;
  return /\bopciones\b/.test(text) && /\b(que|cuales|cual|hay)\b/.test(text);
}

// Un registro de AirNation: si no está en DATOS, no existe en AirNation y buscarlo
// en internet no lo encuentra. Lo demás (límites de FPS o julios, un lugar, tipos
// de réplica o de equipo) sí puede estar fuera.
const RECORD_RE =
  /\b(equipos?|clan|clanes|escuadr\w+|eventos?|operacion|torneos?|partidas?|campos?|sedes?|tienda|productos?|blog|operador|operadores|arsenal)\b/;

// Cuando AirNation no tiene la respuesta, el último intento antes de decir que no
// hay dato. No decide el cupo: eso sigue en createWebBudget.
function wantsWebFallback(message) {
  return !RECORD_RE.test(plain(message));
}

// ponytail: el cupo de búsqueda vive en este proceso. A las 4000 sesiones se
// vacía el mapa; el tope diario sigue en el otro.
function createWebBudget() {
  const sessions = new Map();
  const daily = new Map();
  return {
    allow(sessionKey, userId, now, perSession, dailyCap) {
      const ts = now || Date.now();
      const capSession = perSession || DEFAULTS.webSession;
      const capDay = dailyCap || DEFAULTS.webDaily;
      let row = sessions.get(sessionKey);
      if (!row || ts - row.at > DEFAULTS.sessionTtlMs) row = { n: 0, at: ts };
      const dkey = `${userId || sessionKey}|${dayKey(ts)}`;
      const usedDay = daily.get(dkey) || 0;
      if (row.n >= capSession || usedDay >= capDay) return false;
      row.n += 1;
      row.at = ts;
      sessions.set(sessionKey, row);
      daily.set(dkey, usedDay + 1);
      if (sessions.size > 4000) sessions.clear();
      if (daily.size > 8000) {
        const today = dayKey(ts);
        for (const key of daily.keys()) if (!key.endsWith("|" + today)) daily.delete(key);
      }
      return true;
    },
  };
}

module.exports = {
  createWebBudget,
  wantsWebFallback,
  wantsWebOptions,
};
