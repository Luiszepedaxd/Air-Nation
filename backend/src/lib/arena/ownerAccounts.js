const crypto = require("node:crypto");

/**
 * Password temporal para la cuenta de dueño que crea el super admin.
 * 12 bytes aleatorios en base64url = 16 caracteres sin padding ni símbolos
 * que se rompan al copiar por WhatsApp. Se muestra una sola vez y el dueño
 * está obligado a cambiarlo en el primer login (`must_change_password`).
 */
function generarPasswordTemporal() {
  return crypto.randomBytes(12).toString("base64url");
}

module.exports = { generarPasswordTemporal };
