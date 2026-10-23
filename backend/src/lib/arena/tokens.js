/**
 * Tokens de los links públicos de ARENA (`?t=`). Puro, para poder probar la
 * regla sin BD. Un token que no corresponde se responde como "no encontrado":
 * así no se puede averiguar qué pagos o reservas existen.
 */
const crypto = require("node:crypto");

/** Comparación en tiempo constante; vacío nunca pasa. */
function comparaToken(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

/**
 * Un token abre un pago si es el del pago (carrito) o el de alguna de sus
 * reservas: el pago de una reserva suelta no lleva token propio.
 */
function tokenAbrePago(token, { pago, reservas = [] }) {
  return (
    comparaToken(token, pago?.access_token) ||
    reservas.some((r) => comparaToken(token, r?.access_token))
  );
}

module.exports = { comparaToken, tokenAbrePago };
