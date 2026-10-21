const express = require("express");
const supabase = require("../../lib/supabase");
const { arenaProvider } = require("../../lib/arena/config");
const { providerByName } = require("../../lib/arena/payments");
const { leerReserva } = require("../../lib/arena/bookings");
const { reembolsar } = require("../../lib/arena/refunds");
const { sendArenaError } = require("../../lib/arena/errors");
const { UUID } = require("../../middleware/requireFieldMember");
const notify = require("../../lib/arena/notify");

const router = express.Router();

/**
 * Único camino por el que una reserva pasa a confirmada. Idempotente: el
 * `UPDATE` condicional sobre `arena_payments` es el candado, así que un webhook
 * repetido no vuelve a confirmar ni a mandar correos.
 */
async function aplicarPago(pago, status, raw) {
  if (status === "pagado") {
    const { data: tomado, error } = await supabase
      .from("arena_payments")
      .update({ status: "pagado", raw: raw ?? null })
      .eq("id", pago.id)
      .neq("status", "pagado")
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!tomado) return { resultado: "ya_procesado" };

    const { data: resultado, error: rpcError } = await supabase.rpc("arena_mark_paid", {
      p_booking_id: pago.booking_id,
    });
    if (rpcError) throw rpcError;

    const detalle = await leerReserva({ bookingId: pago.booking_id });
    if (!detalle) return { resultado };

    if (resultado === "confirmada") {
      notify.avisoPagoAprobado(detalle).catch((e) => console.error("[arena] aviso pago:", e.message));
    } else if (resultado === "cancelada_reembolsar") {
      // Pago tardío de una reserva ya cancelada: se devuelve solo.
      const r = await reembolsar(detalle.booking, { motivo: "pago tardío de reserva cancelada" });
      if (r.reembolsado) {
        const fresco = await leerReserva({ bookingId: pago.booking_id });
        if (fresco) {
          notify
            .avisoCanceladaPorCampo(fresco)
            .catch((e) => console.error("[arena] aviso reembolso:", e.message));
        }
      }
    }
    return { resultado };
  }

  if (status === "fallido") {
    // El webhook nunca baja un estado ya pagado o reembolsado.
    const { data: tomado } = await supabase
      .from("arena_payments")
      .update({ status: "fallido", raw: raw ?? null })
      .eq("id", pago.id)
      .in("status", ["creado", "pendiente"])
      .select("id")
      .maybeSingle();
    if (!tomado) return { resultado: "ya_procesado" };

    const detalle = await leerReserva({ bookingId: pago.booking_id });
    if (detalle && detalle.booking.pago_status === "pendiente") {
      notify.avisoPagoFallido(detalle).catch((e) => console.error("[arena] aviso fallido:", e.message));
    }
    return { resultado: "fallido" };
  }

  if (status === "reembolsado") {
    const { data: tomado } = await supabase
      .from("arena_payments")
      .update({ status: "reembolsado", raw: raw ?? null })
      .eq("id", pago.id)
      .eq("status", "pagado")
      .select("id")
      .maybeSingle();
    if (!tomado) return { resultado: "ya_procesado" };

    const { data: booking } = await supabase
      .from("arena_bookings")
      .select("id, total_centavos, reembolso_centavos")
      .eq("id", pago.booking_id)
      .maybeSingle();
    if (booking) {
      const total = Math.max(booking.reembolso_centavos, pago.monto_centavos);
      await supabase
        .from("arena_bookings")
        .update({
          reembolso_centavos: total,
          pago_status: total >= booking.total_centavos ? "reembolsado" : "reembolso_parcial",
        })
        .eq("id", booking.id);
    }
    return { resultado: "reembolsado" };
  }

  return { resultado: "ignorado" };
}

// ─── POST /arena/payments/webhook/:provider ───────────────────────────────────
// Raw body (se monta en index.js antes de express.json). Idempotente por
// (provider, provider_ref).
router.post("/webhook/:provider", async (req, res) => {
  const provider = providerByName(req.params.provider);
  if (!provider) return res.status(404).send("Proveedor desconocido");

  let evento;
  try {
    evento = provider.parseWebhook(req);
  } catch (err) {
    console.error(`[arena:webhook ${req.params.provider}] firma inválida:`, err.message);
    return res.status(400).send("Firma inválida");
  }

  const { data: pago, error } = await supabase
    .from("arena_payments")
    .select("id, booking_id, status, monto_centavos, provider")
    .eq("provider", provider.NAME)
    .eq("provider_ref", evento.provider_ref)
    .maybeSingle();
  if (error) {
    console.error("[arena:webhook] lectura del pago:", error.message);
    return res.status(500).send("Error interno");
  }
  if (!pago) {
    console.warn("[arena:webhook] provider_ref desconocido:", evento.provider_ref);
    return res.status(200).json({ recibido: true, ignorado: true });
  }

  try {
    const r = await aplicarPago(pago, evento.status, evento.raw);
    return res.status(200).json({ recibido: true, ...r });
  } catch (err) {
    // 200 para que el proveedor no reintente en bucle un evento roto.
    console.error("[arena:webhook] procesando:", err.message);
    return res.status(200).json({ recibido: true, error: err.message });
  }
});

// ─── POST /arena/payments/mock/:paymentId/complete?result=ok|fail ─────────────
// Solo con el proveedor de prueba y nunca en producción. El id del pago es el
// que identifica la operación: no hace falta firma.
router.post("/mock/:paymentId/complete", async (req, res) => {
  if (arenaProvider() !== "mock" || process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Ruta no encontrada" });
  }

  const id = String(req.params.paymentId || "").trim();
  if (!UUID.test(id)) return res.status(400).json({ error: "Pago inválido" });

  const resultado = String(req.query.result || "ok").toLowerCase();
  if (!["ok", "fail"].includes(resultado)) {
    return res.status(400).json({ error: "result debe ser ok o fail" });
  }

  const { data: pago, error } = await supabase
    .from("arena_payments")
    .select("id, booking_id, status, monto_centavos, provider")
    .eq("id", id)
    .eq("provider", "mock")
    .maybeSingle();
  if (error) {
    console.error("[arena:mock] lectura del pago:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!pago) return res.status(404).json({ error: "No encontramos ese pago." });

  try {
    const r = await aplicarPago(pago, resultado === "ok" ? "pagado" : "fallido", {
      simulado: true,
      result: resultado,
    });
    return res.json({ ok: true, ...r });
  } catch (err) {
    return sendArenaError(res, err, "mock complete");
  }
});

module.exports = { router, aplicarPago };
