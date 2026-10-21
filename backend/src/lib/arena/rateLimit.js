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
 * IP real del cliente. La app no activa `trust proxy`, así que `req.ip` sería
 * la del proxy de Railway y todas las peticiones caerían en el mismo cupo.
 */
function clientIp(req) {
  const fwd = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.ip || req.socket?.remoteAddress || "desconocida";
}

/** Middleware de Express: 429 con mensaje en español. */
function ipRateLimit(perMinute) {
  const allow = createIpLimit(perMinute);
  return function limite(req, res, next) {
    if (!allow(clientIp(req))) {
      return res.status(429).json({ error: "Demasiados intentos. Espera un minuto." });
    }
    next();
  };
}

module.exports = { createIpLimit, clientIp, ipRateLimit };
