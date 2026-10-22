/**
 * Reembolsos. No hay función de BD para esto: el backend escribe
 * `reembolso_centavos` y `pago_status` con service role después de pedirle el
 * reembolso al proveedor.
 *
 * Un pago puede cubrir varias reservas (carrito). En ese caso el reembolso es
 * parcial: solo el total de la reserva cancelada, y el pago queda
 * `reembolsado` hasta que todas sus reservas lo estén.
 */
const supabase = require("../supabase");
const { providerByName } = require("./payments");
const { avisoReembolsoManual } = require("./notify");

/** Lo que falta por devolver de una reserva, en centavos. */
function montoAReembolsar(booking) {
  return Math.max(booking.total_centavos - booking.reembolso_centavos, 0);
}

/** true si todas las reservas del pago ya están reembolsadas al 100%. */
function pagoTotalmenteReembolsado(reservas) {
  return (
    reservas.length > 0 && reservas.every((r) => r.reembolso_centavos >= r.total_centavos)
  );
}

/** El pago vigente de una reserva: el del carrito si lo tiene, o el suyo. */
async function pagoDeReserva(booking) {
  if (booking.payment_id) {
    const { data } = await supabase
      .from("arena_payments")
      .select("id, provider, provider_ref, monto_centavos, status, booking_id")
      .eq("id", booking.payment_id)
      .eq("status", "pagado")
      .maybeSingle();
    if (data) return data;
  }
  const { data } = await supabase
    .from("arena_payments")
    .select("id, provider, provider_ref, monto_centavos, status, booking_id")
    .eq("booking_id", booking.id)
    .eq("status", "pagado")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

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

  const monto = montoAReembolsar(booking);
  if (monto === 0) return { reembolsado: false, monto_centavos: 0 };

  if (booking.payout_id) {
    await supabase
      .from("arena_bookings")
      .update({ notas_internas: `Reembolso pendiente de descontar: ${motivo || "cancelación"}` })
      .eq("id", booking.id);
    avisoReembolsoManual({ booking, motivo }).catch(() => {});
    return { reembolsado: false, monto_centavos: monto, manual: true };
  }

  const pago = await pagoDeReserva(booking);
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
  await supabase
    .from("arena_bookings")
    .update({
      reembolso_centavos: total,
      pago_status: total >= booking.total_centavos ? "reembolsado" : "reembolso_parcial",
    })
    .eq("id", booking.id);

  // El pago de un carrito solo se marca reembolsado cuando ya no le queda nada.
  const { data: hermanas } = await supabase
    .from("arena_bookings")
    .select("id, total_centavos, reembolso_centavos")
    .or(`payment_id.eq.${pago.id}${pago.booking_id ? `,id.eq.${pago.booking_id}` : ""}`);
  if (pagoTotalmenteReembolsado(hermanas || [])) {
    await supabase.from("arena_payments").update({ status: "reembolsado" }).eq("id", pago.id);
  }

  return { reembolsado: true, monto_centavos: monto };
}

module.exports = { reembolsar, montoAReembolsar, pagoTotalmenteReembolsado };
