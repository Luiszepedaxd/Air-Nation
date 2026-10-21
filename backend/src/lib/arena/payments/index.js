/**
 * Pasarela agnóstica. Cada proveedor exporta la misma interfaz:
 *   createCheckout({ booking, payment, returnUrl }) → { provider_ref, checkout_url?, client_secret? }
 *   parseWebhook(req) → { provider_ref, status: 'pagado'|'fallido'|'reembolsado', raw }  (lanza si la firma no sirve)
 *   refund({ payment, monto_centavos }) → { status }
 */
const { arenaProvider } = require("../config");

const PROVIDERS = { mock: require("./mock") };

/** El proveedor configurado, o null si ARENA no acepta pagos. */
function currentProvider() {
  const name = arenaProvider();
  return name ? PROVIDERS[name] || null : null;
}

/** Un proveedor por nombre (lo usa el webhook, que recibe `:provider` en la ruta). */
function providerByName(name) {
  return PROVIDERS[String(name || "").toLowerCase()] || null;
}

module.exports = { PROVIDERS, currentProvider, providerByName };
