/**
 * Tope por IP para los endpoints públicos que escriben (crear y cancelar).
 *
 * ponytail: ventana en memoria de un solo proceso. Con varias réplicas en
 * Railway cada una permite su propio cupo. Para un tope global haría falta un
 * almacén compartido (Redis o una tabla).
 */

const VENTANA_MS = 60_000;

function createIpLimit(perMinute) {
  const hits = new Map();

  return function allow(ip) {
    const now = Date.now();
    const desde = now - VENTANA_MS;
    if (hits.size > 5000) {
      for (const [k, arr] of hits) if (!arr.some((t) => t > desde)) hits.delete(k);
    }
    const key = String(ip || "desconocida");
    const ventana = (hits.get(key) || []).filter((t) => t > desde);
    if (ventana.length >= perMinute) return false;
    ventana.push(now);
    hits.set(key, ventana);
    return true;
  };
}

/**
 * Middleware de Express: 429 con mensaje en español.
 * `req.ip` ya es la IP real del cliente porque index.js activa
 * `trust proxy = 1`; leer x-forwarded-for a mano dejaría elegir el cupo a
 * quien mande la cabecera.
 */
function ipRateLimit(perMinute) {
  const allow = createIpLimit(perMinute);
  return function limite(req, res, next) {
    if (!allow(req.ip)) {
      return res.status(429).json({ error: "Demasiados intentos. Espera un minuto." });
    }
    next();
  };
}

module.exports = { createIpLimit, ipRateLimit };
