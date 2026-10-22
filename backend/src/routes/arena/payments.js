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

/** Ids de las reservas que cubre un pago: las del carrito y la suelta. */
async function reservasDelPago(pago) {
  const { data, error } = await supabase
    .from("arena_bookings")
    .select("id")
    .eq("payment_id", pago.id);
  if (error) throw error;
  const ids = new Set((data || []).map((b) => b.id));
  if (pago.booking_id) ids.add(pago.booking_id);
  return Array.from(ids);
}

/**
 * Único camino por el que una reserva pasa a confirmada. Idempotente: el
 * `UPDATE` condicional sobre `arena_payments` es el candado, así que un webhook
 * repetido no vuelve a confirmar ni a mandar correos.
 *
 * Un pago puede cubrir varias reservas (carrito): `arena_mark_payment_paid`
 * las confirma todas y el jugador recibe un solo email con todos los QR.
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

    const { data: filas, error: rpcError } = await supabase.rpc("arena_mark_payment_paid", {
      p_payment_id: pago.id,
    });
    if (rpcError) throw rpcError;
    const resultados = Array.isArray(filas) ? filas : [];

    const confirmadas = [];
    for (const fila of resultados) {
      const detalle = await leerReserva({ bookingId: fila.booking_id });
      if (!detalle) continue;
      if (fila.resultado === "confirmada") {
        confirmadas.push(detalle);
      } else if (fila.resultado === "cancelada_reembolsar") {
        // Pago tardío de una reserva ya cancelada: se devuelve solo su monto.
        const r = await reembolsar(detalle.booking, { motivo: "pago tardío de reserva cancelada" });
        if (r.reembolsado) {
          const fresco = await leerReserva({ bookingId: fila.booking_id });
          if (fresco) {
            notify
              .avisoCanceladaPorCampo(fresco)
              .catch((e) => console.error("[arena] aviso reembolso:", e.message));
          }
        }
      }
    }

    if (confirmadas.length > 0) {
      notify
        .avisoPagoAprobado(confirmadas, pago)
        .catch((e) => console.error("[arena] aviso pago:", e.message));
    }

    return {
      resultado: resultados.length === 1 ? resultados[0].resultado : "procesado",
      reservas: resultados,
    };
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

    // Solo la reserva suelta recibe el email de reintento: en un carrito el
    // jugador está en el checkout y ve el error ahí, y las reservas vencen en
    // 15 min. ponytail: si hace falta avisar del carrito, va aquí.
    const ids = await reservasDelPago(pago);
    if (ids.length === 1) {
      const detalle = await leerReserva({ bookingId: ids[0] });
      if (detalle && detalle.booking.pago_status === "pendiente") {
        notify.avisoPagoFallido(detalle).catch((e) => console.error("[arena] aviso fallido:", e.message));
      }
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

    // El proveedor reembolsó el pago completo: todas sus reservas quedan al 100%.
    const ids = await reservasDelPago(pago);
    const { data: reservas } = await supabase
      .from("arena_bookings")
      .select("id, total_centavos, reembolso_centavos")
      .in("id", ids);
    for (const b of reservas || []) {
      await supabase
        .from("arena_bookings")
        .update({ reembolso_centavos: b.total_centavos, pago_status: "reembolsado" })
        .eq("id", b.id);
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
    console.error(`[arena:webhook ${req.params.provider}] ${err.message}`);
    // Sin secreto para verificar, el webhook está sin configurar, no rechazado.
    if (err.message === "secreto_faltante") return res.status(503).send("Webhook sin configurar");
    return res.status(400).send("Firma inválida");
  }

  const { data: pago, error } = await supabase
    .from("arena_payments")
    .select("id, booking_id, status, monto_centavos, provider, access_token")
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
    .select("id, booking_id, status, monto_centavos, provider, access_token")
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
