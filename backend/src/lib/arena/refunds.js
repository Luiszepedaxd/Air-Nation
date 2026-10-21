/**
 * Reembolsos. No hay función de BD para esto: el backend escribe
 * `reembolso_centavos` y `pago_status` con service role después de pedirle el
 * reembolso al proveedor.
 */
const supabase = require("../supabase");
const { providerByName } = require("./payments");
const { avisoReembolsoManual } = require("./notify");

/**
 * Reembolsa una reserva ya pagada.
 * Una reserva con `payout_id` ya se liquidó al campo: no se reembolsa sola,
 * queda marcada y se avisa al admin para descontarla de la próxima liquidación.
 * @returns {Promise<{ reembolsado: boolean, monto_centavos: number, manual?: boolean }>}
 */
async function reembolsar(booking, { motivo } = {}) {
  if (booking.pago_status !== "pagado") {
    return { reembolsado: false, monto_centavos: 0 };
  }

  const monto = Math.max(booking.total_centavos - booking.reembolso_centavos, 0);
  if (monto === 0) return { reembolsado: false, monto_centavos: 0 };

  if (booking.payout_id) {
    await supabase
      .from("arena_bookings")
      .update({ notas_internas: `Reembolso pendiente de descontar: ${motivo || "cancelación"}` })
      .eq("id", booking.id);
    avisoReembolsoManual({ booking, motivo }).catch(() => {});
    return { reembolsado: false, monto_centavos: monto, manual: true };
  }

  const { data: pago } = await supabase
    .from("arena_payments")
    .select("id, provider, provider_ref, monto_centavos, status")
    .eq("booking_id", booking.id)
    .eq("status", "pagado")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pago) {
    console.error("[arena:refund] reserva pagada sin pago registrado:", booking.codigo);
    return { reembolsado: false, monto_centavos: 0 };
  }

  const provider = providerByName(pago.provider);
  if (!provider) {
    console.error("[arena:refund] proveedor desconocido:", pago.provider);
    return { reembolsado: false, monto_centavos: 0 };
  }

  try {
    await provider.refund({ payment: pago, monto_centavos: monto });
  } catch (err) {
    console.error("[arena:refund] el proveedor rechazó el reembolso:", err.message);
    return { reembolsado: false, monto_centavos: 0 };
  }

  const total = booking.reembolso_centavos + monto;
  await Promise.all([
    supabase.from("arena_payments").update({ status: "reembolsado" }).eq("id", pago.id),
    supabase
      .from("arena_bookings")
      .update({
        reembolso_centavos: total,
        pago_status: total >= booking.total_centavos ? "reembolsado" : "reembolso_parcial",
      })
      .eq("id", booking.id),
  ]);

  return { reembolsado: true, monto_centavos: monto };
}

module.exports = { reembolsar };
