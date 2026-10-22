/**
 * Todo lo que la BD ya sabe hacer se llama por RPC: precios, validación de
 * días, confirmación y check-in. Aquí solo va lo que no tiene función propia
 * (leer una reserva completa y el plazo de cancelación).
 */
const crypto = require("node:crypto");
const supabase = require("../supabase");
const { limiteCancelacion } = require("./horario");
const { currentProvider } = require("./payments");
const { arenaPublicUrl } = require("./config");
const { checkinUrl } = require("./qr");

/**
 * Lo único que viaja del cliente a `arena_create_booking`: qué concepto y
 * cuántos. Cualquier `precio_centavos` o `subtotal` que mande el cliente se
 * descarta aquí; los montos salen siempre de la BD.
 */
function sanearItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((i) => {
    const item_id = String(i?.item_id ?? "");
    const cantidad = Number(i?.cantidad);
    return Number.isInteger(cantidad) && cantidad >= 1 ? { item_id, cantidad } : { item_id };
  });
}

/** Devuelve la primera fila de una función que RETURNS TABLE. */
function unaFila(data) {
  return Array.isArray(data) ? data[0] || null : data || null;
}

const CAMPO_PUBLICO =
  "id, nombre, slug, ciudad, estado, direccion, maps_url, foto_portada_url, galeria_urls, logo_url, descripcion, promedio_rating, horarios_json";

/**
 * Reserva completa con sus renglones, el campo, la configuración y el último
 * intento de pago. Nunca incluye los datos bancarios del campo.
 */
async function leerReserva({ codigo, bookingId }) {
  const q = supabase.from("arena_bookings").select("*");
  const { data: booking, error } = await (codigo ? q.eq("codigo", codigo) : q.eq("id", bookingId))
    .maybeSingle();
  if (error) throw error;
  if (!booking) return null;

  const [itemsRes, fieldRes, settingsRes, pagosRes] = await Promise.all([
    supabase
      .from("arena_booking_items")
      .select("id, item_id, tipo, nombre, unidad, precio_unit_centavos, cantidad, subtotal_centavos")
      .eq("booking_id", booking.id),
    supabase.from("fields").select(CAMPO_PUBLICO).eq("id", booking.field_id).maybeSingle(),
    supabase
      .from("arena_field_settings")
      .select("politica_cancelacion, cancelacion_horas_limite, telefono_avisos, activo")
      .eq("field_id", booking.field_id)
      .maybeSingle(),
    supabase
      .from("arena_payments")
      .select("id, provider, provider_ref, status, monto_centavos, checkout_url, created_at")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false }),
  ]);

  const settings = settingsRes.data || { cancelacion_horas_limite: 24, politica_cancelacion: null };
  const field = fieldRes.data || null;
  const pagos = pagosRes.data || [];

  return {
    booking,
    items: itemsRes.data || [],
    field,
    settings,
    pagos,
    pagoVigente: pagos.find((p) => p.status === "creado" || p.status === "pendiente") || null,
    limiteCancelacion: limiteCancelacion({
      fecha: booking.fecha,
      horariosJson: field?.horarios_json,
      cancelacionHorasLimite: settings.cancelacion_horas_limite,
    }),
  };
}

/** Forma que ve el jugador (y el dueño en su agenda). Sin tokens de más. */
function serializarReserva(detalle, { incluirQr = false } = {}) {
  const { booking, items, field, settings, pagoVigente, limiteCancelacion: limite } = detalle;
  const cancelable =
    booking.status === "confirmada" && Date.now() <= limite.getTime() && booking.pago_status === "pagado";

  return {
    codigo: booking.codigo,
    fecha: booking.fecha,
    num_jugadores: booking.num_jugadores,
    jugadores_llegaron: booking.jugadores_llegaron,
    status: booking.status,
    pago_status: booking.pago_status,
    origen: booking.origen,
    contacto_nombre: booking.contacto_nombre,
    contacto_email: booking.contacto_email,
    contacto_telefono: booking.contacto_telefono,
    notas_jugador: booking.notas_jugador,
    subtotal_centavos: booking.subtotal_centavos,
    total_centavos: booking.total_centavos,
    reembolso_centavos: booking.reembolso_centavos,
    expires_at: booking.expires_at,
    checkin_at: booking.checkin_at,
    cancelada_at: booking.cancelada_at,
    cancelada_por: booking.cancelada_por,
    motivo_cancelacion: booking.motivo_cancelacion,
    created_at: booking.created_at,
    items: items.map((i) => ({
      nombre: i.nombre,
      tipo: i.tipo,
      unidad: i.unidad,
      cantidad: i.cantidad,
      precio_unit_centavos: i.precio_unit_centavos,
      subtotal_centavos: i.subtotal_centavos,
    })),
    campo: field
      ? {
          id: field.id,
          nombre: field.nombre,
          slug: field.slug,
          ciudad: field.ciudad,
          direccion: field.direccion,
          maps_url: field.maps_url,
          foto_portada_url: field.foto_portada_url,
          telefono: settings.telefono_avisos ?? null,
        }
      : null,
    politica_cancelacion: settings.politica_cancelacion ?? null,
    cancelacion_horas_limite: settings.cancelacion_horas_limite,
    limite_cancelacion: limite.toISOString(),
    cancelable,
    pago_pendiente: pagoVigente
      ? { id: pagoVigente.id, provider: pagoVigente.provider, checkout_url: pagoVigente.checkout_url }
      : null,
    // Sin pago aprobado no hay QR: una reserva pendiente no debe parecer válida.
    ...(incluirQr &&
    booking.pago_status !== "pendiente" &&
    ["confirmada", "completada", "no_show"].includes(booking.status)
      ? { qr_token: booking.qr_token, qr_url: checkinUrl(booking.qr_token) }
      : {}),
  };
}

/**
 * Crea el intento de pago con el proveedor configurado y lo guarda en
 * `arena_payments`. El monto sale siempre de la reserva, nunca del cliente.
 */
async function abrirCheckout(booking) {
  const provider = currentProvider();
  if (!provider) throw new Error("arena_inactivo");

  const checkout = await provider.createCheckout({
    booking,
    payment: { monto_centavos: booking.total_centavos, moneda: "MXN" },
    returnUrl: `${arenaPublicUrl()}/reservas/${booking.codigo}?t=${booking.access_token}`,
  });

  const { data: pago, error } = await supabase
    .from("arena_payments")
    .insert({
      booking_id: booking.id || booking.booking_id,
      provider: provider.NAME,
      provider_ref: checkout.provider_ref,
      monto_centavos: booking.total_centavos,
      moneda: "MXN",
      status: "creado",
      checkout_url: checkout.checkout_url || null,
    })
    .select("id, provider, provider_ref, status, checkout_url, monto_centavos")
    .maybeSingle();
  if (error) throw error;

  return { pago, checkout };
}

/**
 * `arena_create_booking` + checkout. Los precios, la comisión y la validación
 * del día los hace la función de la BD; aquí no se calcula dinero.
 */
async function crearReserva(params) {
  if (!currentProvider()) throw new Error("arena_inactivo");

  const { data, error } = await supabase.rpc("arena_create_booking", params);
  if (error) throw error;
  const creada = unaFila(data);
  if (!creada) throw new Error("total_invalido");

  const booking = { ...creada, id: creada.booking_id };
  const { pago, checkout } = await abrirCheckout(booking);
  return { booking, pago, checkout };
}

/**
 * Carrito completo: `arena_create_checkout` crea todas las reservas en una sola
 * transacción y aquí se abre **un** pago por la suma de sus totales.
 *
 * El `provider_ref` es NOT NULL, así que el id del pago se genera aquí para
 * poder pedirle el checkout al proveedor antes de insertarlo: así se escribe
 * una sola vez.
 */
async function crearCheckoutCarrito({ reservas, contacto, userId = null, origen = "web" }) {
  const provider = currentProvider();
  if (!provider) throw new Error("arena_inactivo");

  const { data, error } = await supabase.rpc("arena_create_checkout", {
    p_reservas: reservas,
    p_contacto_nombre: contacto.nombre,
    p_contacto_email: contacto.email,
    p_contacto_telefono: contacto.telefono,
    p_user_id: userId,
    p_origen: origen,
  });
  if (error) throw error;

  const creadas = Array.isArray(data) ? data : [];
  if (creadas.length === 0) throw new Error("carrito_vacio");

  const total = creadas.reduce((s, r) => s + r.total_centavos, 0);
  const paymentId = crypto.randomUUID();
  const accessToken = crypto.randomBytes(32).toString("hex");

  const checkout = await provider.createCheckout({
    payment: { id: paymentId, access_token: accessToken, monto_centavos: total, moneda: "MXN" },
    returnUrl: `${arenaPublicUrl()}/arena/confirmacion?p=${paymentId}&t=${accessToken}`,
  });

  const { data: pago, error: pagoError } = await supabase
    .from("arena_payments")
    .insert({
      id: paymentId,
      booking_id: null,
      provider: provider.NAME,
      provider_ref: checkout.provider_ref,
      monto_centavos: total,
      moneda: "MXN",
      status: "creado",
      checkout_url: checkout.checkout_url || null,
      access_token: accessToken,
    })
    .select("id, provider, provider_ref, status, checkout_url, monto_centavos, access_token")
    .maybeSingle();
  // Sin pago las reservas quedan pendientes y `arena_expire_pending` las limpia.
  if (pagoError) throw pagoError;

  const { error: ligaError } = await supabase
    .from("arena_bookings")
    .update({ payment_id: paymentId })
    .in("id", creadas.map((r) => r.booking_id));
  if (ligaError) throw ligaError;

  return { reservas: creadas, pago, checkout, total_centavos: total };
}

module.exports = {
  sanearItems,
  unaFila,
  abrirCheckout,
  crearReserva,
  crearCheckoutCarrito,
  leerReserva,
  serializarReserva,
  CAMPO_PUBLICO,
};
