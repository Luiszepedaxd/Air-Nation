const crypto = require("node:crypto");
const express = require("express");
const supabase = require("../../lib/supabase");
const { requireAuth } = require("../../middleware/requireAuth");
const { optionalAuth } = require("../../middleware/optionalAuth");
const { UUID } = require("../../middleware/requireFieldMember");
const { arenaProvider } = require("../../lib/arena/config");
const { sendArenaError } = require("../../lib/arena/errors");
const { ipRateLimit } = require("../../lib/arena/rateLimit");
const { checkinUrl, qrPng } = require("../../lib/arena/qr");
const { reembolsar } = require("../../lib/arena/refunds");
const {
  abrirCheckout,
  crearReserva,
  leerReserva,
  sanearItems,
  serializarReserva,
  unaFila,
  CAMPO_PUBLICO,
} = require("../../lib/arena/bookings");
const notify = require("../../lib/arena/notify");
const { dayKey } = require("../../services/joulie/time");

const router = express.Router();

const CODIGO = /^AR-[0-9A-Z]{6}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function comparaToken(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

const QR_VISIBLE = ["confirmada", "completada", "no_show"];

/**
 * Reserva accesible con el token del link o por ser su dueño con sesión.
 * Un token que no corresponde responde 404, igual que una reserva inexistente:
 * así no se puede averiguar qué códigos existen.
 */
async function reservaAutorizada(req, res) {
  const codigo = String(req.params.codigo || "").trim().toUpperCase();
  if (!CODIGO.test(codigo)) {
    res.status(404).json({ error: "No encontramos esa reserva.", code: "reserva_no_encontrada" });
    return null;
  }
  const detalle = await leerReserva({ codigo });
  const token = String(req.query.t || req.body?.t || "");
  const autorizado =
    detalle &&
    (comparaToken(token, detalle.booking.access_token) ||
      (req.userId && detalle.booking.user_id === req.userId));
  if (!autorizado) {
    res.status(404).json({ error: "No encontramos esa reserva.", code: "reserva_no_encontrada" });
    return null;
  }
  return detalle;
}

// ─── GET /arena/fields/:slug ──────────────────────────────────────────────────
// Config pública, catálogo activo y horario semanal. 404 si ARENA no está activo.
router.get("/fields/:slug", async (req, res) => {
  const slug = String(req.params.slug || "").trim();
  if (!slug) return res.status(404).json({ error: "Campo no encontrado" });

  const { data: field, error } = await supabase
    .from("fields")
    .select(CAMPO_PUBLICO)
    .eq("slug", slug)
    .eq("status", "aprobado")
    .maybeSingle();
  if (error) {
    console.error("[arena:public] field:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!field) return res.status(404).json({ error: "Campo no encontrado" });

  const [settingsRes, itemsRes] = await Promise.all([
    supabase
      .from("arena_field_settings")
      .select(
        "activo, politica_cancelacion, cancelacion_horas_limite, anticipacion_min_horas, anticipacion_max_dias"
      )
      .eq("field_id", field.id)
      .maybeSingle(),
    supabase
      .from("arena_items")
      .select(
        "id, tipo, es_base, nombre, descripcion, incluye, precio_centavos, unidad, min_jugadores, max_jugadores, max_por_reserva, fotos_urls, orden"
      )
      .eq("field_id", field.id)
      .eq("activo", true)
      .order("orden", { ascending: true }),
  ]);

  if (!settingsRes.data || !settingsRes.data.activo) {
    return res.status(404).json({ error: "Este campo no acepta reservas en línea.", code: "arena_inactivo" });
  }

  return res.json({
    field,
    arena: {
      ...settingsRes.data,
      // Sin proveedor configurado ARENA no cobra: el botón RESERVAR se oculta.
      reservas_habilitadas: Boolean(arenaProvider()),
    },
    items: itemsRes.data || [],
  });
});

// ─── GET /arena/fields/:fieldId/open-days?desde&hasta ─────────────────────────
router.get("/fields/:fieldId/open-days", async (req, res) => {
  const fieldId = String(req.params.fieldId || "").trim();
  if (!UUID.test(fieldId)) return res.status(400).json({ error: "Campo inválido" });

  const hoy = dayKey(Date.now());
  const desde = FECHA.test(String(req.query.desde || "")) ? String(req.query.desde) : hoy;
  const hasta = FECHA.test(String(req.query.hasta || "")) ? String(req.query.hasta) : null;
  if (!hasta) return res.status(400).json({ error: "Falta el rango de fechas.", code: "rango_invalido" });

  const { data, error } = await supabase.rpc("arena_open_days", {
    p_field_id: fieldId,
    p_desde: desde,
    p_hasta: hasta,
  });
  if (error) return sendArenaError(res, error, "arena_open_days");
  return res.json({ dias: data || [] });
});

// ─── POST /arena/bookings ─────────────────────────────────────────────────────
router.post("/bookings", ipRateLimit(10), optionalAuth, async (req, res) => {
  const b = req.body || {};
  const fieldId = String(b.field_id || "").trim();
  if (!UUID.test(fieldId)) return res.status(400).json({ error: "Campo inválido" });
  if (!FECHA.test(String(b.fecha || ""))) {
    return res.status(400).json({ error: "La fecha debe venir como YYYY-MM-DD." });
  }
  if (!Array.isArray(b.items) || b.items.length === 0) {
    return res.status(400).json({ error: "Elige un paquete o un derecho de campo.", code: "falta_item_base" });
  }
  if (b.items.length > 20) return res.status(400).json({ error: "Demasiados conceptos." });
  if (b.acepta_politica !== true) {
    return res.status(400).json({ error: "Tienes que aceptar la política de cancelación." });
  }

  const items = sanearItems(b.items);

  try {
    const { booking, pago } = await crearReserva({
      p_field_id: fieldId,
      p_fecha: String(b.fecha),
      p_num_jugadores: Number(b.num_jugadores),
      p_items: items,
      p_contacto_nombre: String(b.contacto_nombre || "").slice(0, 120),
      p_contacto_email: String(b.contacto_email || "").slice(0, 200),
      p_contacto_telefono: b.contacto_telefono ? String(b.contacto_telefono).slice(0, 40) : null,
      p_user_id: req.userId || null,
      p_origen: b.origen === "app" ? "app" : "web",
      p_notas_jugador: b.notas_jugador ? String(b.notas_jugador).slice(0, 500) : null,
      p_created_by: req.userId || null,
    });

    return res.status(201).json({
      codigo: booking.codigo,
      access_token: booking.access_token,
      total_centavos: booking.total_centavos,
      expires_at: booking.expires_at,
      status: booking.status,
      pago: pago
        ? { id: pago.id, provider: pago.provider, checkout_url: pago.checkout_url }
        : null,
    });
  } catch (err) {
    return sendArenaError(res, err, "arena_create_booking");
  }
});

// ─── GET /arena/bookings/:codigo?t= ───────────────────────────────────────────
router.get("/bookings/:codigo", optionalAuth, async (req, res) => {
  const detalle = await reservaAutorizada(req, res);
  if (!detalle) return;
  return res.json({ reserva: serializarReserva(detalle, { incluirQr: true }) });
});

// ─── POST /arena/bookings/:codigo/pay ─────────────────────────────────────────
// Reintento de pago mientras la reserva no haya vencido.
router.post("/bookings/:codigo/pay", ipRateLimit(10), optionalAuth, async (req, res) => {
  const detalle = await reservaAutorizada(req, res);
  if (!detalle) return;
  const { booking, pagoVigente } = detalle;

  if (booking.pago_status === "pagado") {
    return res.status(409).json({ error: "Esta reserva ya está pagada.", code: "transicion_invalida" });
  }
  if (booking.status !== "pendiente_pago") {
    return res.status(409).json({ error: "Esta reserva ya no se puede pagar.", code: "transicion_invalida" });
  }
  if (booking.expires_at && Date.parse(booking.expires_at) <= Date.now()) {
    return res.status(409).json({ error: "El tiempo para pagar se agotó.", code: "transicion_invalida" });
  }

  if (pagoVigente?.checkout_url) {
    return res.json({ pago: { id: pagoVigente.id, provider: pagoVigente.provider, checkout_url: pagoVigente.checkout_url } });
  }

  try {
    const { pago } = await abrirCheckout(booking);
    return res.json({ pago: { id: pago.id, provider: pago.provider, checkout_url: pago.checkout_url } });
  } catch (err) {
    return sendArenaError(res, err, "reintento de pago");
  }
});

// ─── POST /arena/bookings/:codigo/cancel ──────────────────────────────────────
router.post("/bookings/:codigo/cancel", ipRateLimit(10), optionalAuth, async (req, res) => {
  const detalle = await reservaAutorizada(req, res);
  if (!detalle) return;
  const { booking } = detalle;

  if (!["confirmada", "pendiente_pago"].includes(booking.status)) {
    return res.status(409).json({ error: "Esta reserva ya no se puede cancelar.", code: "transicion_invalida" });
  }
  if (booking.status === "confirmada" && Date.now() > detalle.limiteCancelacion.getTime()) {
    return res.status(409).json({
      error: "Ya pasó el plazo para cancelar con reembolso.",
      code: "fuera_de_plazo_cancelacion",
      detalle: detalle.limiteCancelacion.toISOString(),
    });
  }

  // El `IN` del UPDATE es el candado: dos cancelaciones a la vez no se pisan.
  const { data: cancelada, error } = await supabase
    .from("arena_bookings")
    .update({
      status: "cancelada",
      cancelada_at: new Date().toISOString(),
      cancelada_por: "jugador",
      motivo_cancelacion: req.body?.motivo ? String(req.body.motivo).slice(0, 300) : null,
      expires_at: null,
    })
    .eq("id", booking.id)
    .in("status", ["confirmada", "pendiente_pago"])
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[arena:public] cancelar:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!cancelada) {
    return res.status(409).json({ error: "Esta reserva ya no se puede cancelar.", code: "transicion_invalida" });
  }

  const r = await reembolsar(cancelada, { motivo: "cancelación del jugador" });
  const fresco = await leerReserva({ bookingId: booking.id });
  if (fresco) {
    notify
      .avisoCanceladaPorJugador(fresco)
      .catch((e) => console.error("[arena] aviso cancelación:", e.message));
  }

  return res.json({
    reserva: fresco ? serializarReserva(fresco) : null,
    reembolso_centavos: r.monto_centavos,
    reembolso_manual: Boolean(r.manual),
  });
});

// ─── GET /arena/bookings/:codigo/qr.png?t= ────────────────────────────────────
router.get("/bookings/:codigo/qr.png", optionalAuth, async (req, res) => {
  const detalle = await reservaAutorizada(req, res);
  if (!detalle) return;
  if (!QR_VISIBLE.includes(detalle.booking.status) || detalle.booking.pago_status === "pendiente") {
    return res.status(404).json({ error: "Esta reserva todavía no tiene QR." });
  }
  try {
    const png = await qrPng(detalle.booking.qr_token, 600);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("Content-Disposition", `inline; filename="${detalle.booking.codigo}.png"`);
    return res.send(png);
  } catch (err) {
    console.error("[arena:public] qr.png:", err.message);
    return res.status(500).json({ error: "No se pudo generar el QR." });
  }
});

// ─── GET /arena/me/bookings ───────────────────────────────────────────────────
router.get("/me/bookings", requireAuth, async (req, res) => {
  const hoy = dayKey(Date.now());
  const { data, error } = await supabase
    .from("arena_bookings")
    .select(
      "id, codigo, fecha, num_jugadores, status, pago_status, total_centavos, reembolso_centavos, access_token, qr_token, field_id, created_at"
    )
    .eq("user_id", req.authUser.id)
    .order("fecha", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[arena:public] me/bookings:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  const ids = Array.from(new Set((data || []).map((b) => b.field_id)));
  const camposRes = ids.length
    ? await supabase.from("fields").select("id, nombre, slug, ciudad, foto_portada_url").in("id", ids)
    : { data: [] };
  const campos = new Map((camposRes.data || []).map((f) => [f.id, f]));

  const reservas = (data || []).map((b) => ({
    codigo: b.codigo,
    fecha: b.fecha,
    num_jugadores: b.num_jugadores,
    status: b.status,
    pago_status: b.pago_status,
    total_centavos: b.total_centavos,
    reembolso_centavos: b.reembolso_centavos,
    access_token: b.access_token,
    campo: campos.get(b.field_id) || null,
    // El QR tiene que codificar la URL pública, no la del navegador.
    ...(QR_VISIBLE.includes(b.status) && b.pago_status !== "pendiente"
      ? { qr_token: b.qr_token, qr_url: checkinUrl(b.qr_token) }
      : {}),
  }));

  return res.json({
    proximas: reservas.filter((b) => b.fecha >= hoy),
    pasadas: reservas.filter((b) => b.fecha < hoy),
    hoy,
  });
});

// ─── Check-in ─────────────────────────────────────────────────────────────────
/** El QR no dice nada a quien no es staff del campo. */
async function reservaDeQr(req, res) {
  const qrToken = String(req.params.qrToken || "").trim();
  if (!/^[0-9a-f]{64}$/i.test(qrToken)) {
    res.status(404).json({ error: "Este QR no corresponde a ninguna reserva.", code: "qr_invalido" });
    return null;
  }
  const { data: booking, error } = await supabase
    .from("arena_bookings")
    .select("*")
    .eq("qr_token", qrToken)
    .maybeSingle();
  if (error) {
    console.error("[arena:checkin] lectura:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
    return null;
  }
  if (!booking) {
    res.status(404).json({ error: "Este QR no corresponde a ninguna reserva.", code: "qr_invalido" });
    return null;
  }

  const { data: miembro } = await supabase.rpc("arena_is_field_member", {
    p_field_id: booking.field_id,
    p_user_id: req.authUser.id,
  });
  if (miembro !== true) {
    res.status(403).json({ error: "Este QR es para el staff del campo.", code: "sin_permiso" });
    return null;
  }
  return booking;
}

router.get("/checkin/:qrToken", requireAuth, async (req, res) => {
  const booking = await reservaDeQr(req, res);
  if (!booking) return;

  const [itemsRes, fieldRes] = await Promise.all([
    supabase
      .from("arena_booking_items")
      .select("nombre, tipo, unidad, cantidad, subtotal_centavos")
      .eq("booking_id", booking.id),
    supabase.from("fields").select("id, nombre, slug").eq("id", booking.field_id).maybeSingle(),
  ]);

  return res.json({
    reserva: {
      codigo: booking.codigo,
      fecha: booking.fecha,
      num_jugadores: booking.num_jugadores,
      jugadores_llegaron: booking.jugadores_llegaron,
      status: booking.status,
      pago_status: booking.pago_status,
      total_centavos: booking.total_centavos,
      contacto_nombre: booking.contacto_nombre,
      contacto_telefono: booking.contacto_telefono,
      notas_jugador: booking.notas_jugador,
      checkin_at: booking.checkin_at,
      items: itemsRes.data || [],
      campo: fieldRes.data || null,
    },
    hoy: dayKey(Date.now()),
  });
});

router.post("/checkin/:qrToken", requireAuth, async (req, res) => {
  const booking = await reservaDeQr(req, res);
  if (!booking) return;

  let llegaron = null;
  if (req.body?.jugadores_llegaron !== undefined && req.body.jugadores_llegaron !== null) {
    llegaron = Number(req.body.jugadores_llegaron);
    if (!Number.isInteger(llegaron) || llegaron < 0 || llegaron > 500) {
      return res.status(400).json({ error: "El número de jugadores que llegaron no es válido." });
    }
  }

  const { data, error } = await supabase.rpc("arena_checkin", {
    p_qr_token: booking.qr_token,
    p_user_id: req.authUser.id,
    p_field_id: booking.field_id,
    p_jugadores_llegaron: llegaron,
  });
  if (error) return sendArenaError(res, error, "arena_checkin");

  const detalle = await leerReserva({ bookingId: booking.id });
  if (detalle) notify.avisoCheckin(detalle).catch(() => {});

  return res.json({ checkin: unaFila(data) });
});

module.exports = router;
