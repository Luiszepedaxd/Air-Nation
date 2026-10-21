/**
 * Proveedor de prueba. No cobra nada: el checkout es una pantalla de AirNation
 * con botones aprobar / rechazar que disparan el mismo flujo del webhook.
 * Conectar el proveedor real es escribir otro archivo como este.
 */
const crypto = require("node:crypto");
const { arenaPublicUrl } = require("../config");

const NAME = "mock";

async function createCheckout({ booking }) {
  return {
    provider_ref: `mock_${crypto.randomBytes(16).toString("hex")}`,
    checkout_url: `${arenaPublicUrl()}/reservas/${booking.codigo}/pago-simulado?t=${booking.access_token}`,
  };
}

/**
 * El webhook genérico tiene que quedar cerrado también para el mock: si no,
 * cualquiera podría marcar una reserva como pagada. Se firma con la service
 * key que el backend ya tiene, en `x-arena-mock-signature`.
 * Los botones de la pantalla de prueba no pasan por aquí: llaman a
 * POST /arena/payments/mock/:paymentId/complete, que ya identifica el pago.
 */
function parseWebhook(req) {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ""));
  const secret = process.env.SUPABASE_SERVICE_KEY || "";
  const firma = String(req.headers["x-arena-mock-signature"] || "");
  const esperada = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!secret || firma.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) {
    throw new Error("firma_invalida");
  }

  const body = JSON.parse(raw.toString("utf8") || "{}");
  if (!body.provider_ref || !["pagado", "fallido", "reembolsado"].includes(body.status)) {
    throw new Error("firma_invalida");
  }
  return { provider_ref: String(body.provider_ref), status: body.status, raw: body };
}

async function refund({ monto_centavos }) {
  return { status: "reembolsado", monto_centavos };
}

module.exports = { NAME, createCheckout, parseWebhook, refund };
