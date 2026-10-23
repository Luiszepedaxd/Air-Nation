const crypto = require("node:crypto");
const express = require("express");
const supabase = require("../../lib/supabase");
const { requireAuth } = require("../../middleware/requireAuth");
const { optionalAuth } = require("../../middleware/optionalAuth");
const { UUID } = require("../../middleware/requireFieldMember");
const { arenaProvider } = require("../../lib/arena/config");
const { arenaError, sendArenaError } = require("../../lib/arena/errors");
const { ipRateLimit } = require("../../lib/arena/rateLimit");
const { checkinUrl, qrPng } = require("../../lib/arena/qr");
const { reembolsar } = require("../../lib/arena/refunds");
const {
  abrirCheckout,
  crearReserva,
  crearCheckoutCarrito,
  leerReserva,
  sanearItems,
  serializarReserva,
  unaFila,
  CAMPO_PUBLICO,
} = require("../../lib/arena/bookings");
const notify = require("../../lib/arena/notify");
const { parseMarketplaceQuery, parseCarrito } = require("../../lib/arena/marketplace");
const { dayHours } = require("../../lib/arena/horario");
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

// ─── GET /arena/landing-media ────────────────────────────────────────────────
// Hero, banners y promos activos de la landing. Si la tabla todavía no existe
// (falta correr supabase/sql/arena_landing.sql) la landing se ve sin banners.
router.get("/landing-media", async (_req, res) => {
  const { data, error } = await supabase
    .from("arena_landing_media")
    .select("id, slot, url, titulo, subtitulo, cta_label, cta_href, orden")
    .eq("activo", true)
    .order("orden", { ascending: true });
  if (error) {
    console.error("[arena:public] landing-media:", error.message);
    return res.json({ media: [] });
  }
  return res.json({ media: data || [] });
});

// ─── GET /arena/marketplace ──────────────────────────────────────────────────
// Listado del marketplace: `arena_marketplace` hace el filtrado, el precio
// "desde" y los próximos días abiertos. Público y cacheable 60 s, así que
// nunca muestra campos de prueba (esos se revisan desde /admin/arena).
router.get("/marketplace", async (req, res) => {
  const parsed = parseMarketplaceQuery(req.query);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const [rpc, settingsRes, camposRes] = await Promise.all([
    supabase.rpc("arena_marketplace", parsed.params),
    supabase.from("arena_field_settings").select("field_id").eq("activo", true),
    supabase.from("fields").select("id, estado, es_prueba").eq("status", "aprobado"),
  ]);
  if (rpc.error) {
    console.error("[arena:public] marketplace rpc:", rpc.error.message);
    const mapped = arenaError(rpc.error);
    return res.status(mapped.status).json(
      mapped.status === 500 ? { error: "Error interno del servidor", code: "marketplace_rpc" } : mapped.body
    );
  }
  if (settingsRes.error || camposRes.error) {
    console.error("[arena:public] marketplace catálogo:", (settingsRes.error || camposRes.error).message);
    return res.status(500).json({ error: "Error interno del servidor", code: "marketplace_catalogo" });
  }

  const conArena = new Set((settingsRes.data || []).map((s) => s.field_id));
  const dePrueba = new Set((camposRes.data || []).filter((f) => f.es_prueba === true).map((f) => f.id));
  const campos = (rpc.data || []).filter((c) => !dePrueba.has(c.field_id));

  // El buscador necesita todos los estados con ARENA, no solo los del filtro.
  const estados = Array.from(
    new Set(
      (camposRes.data || [])
        .filter((f) => conArena.has(f.id) && !dePrueba.has(f.id) && f.estado)
        .map((f) => f.estado)
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

  res.setHeader("Cache-Control", "public, max-age=60");
  return res.json({
    campos,
    total: campos.length,
    filtros: { estados },
    reservas_habilitadas: Boolean(arenaProvider()),
    hoy: dayKey(Date.now()),
  });
});

// ─── GET /arena/fields/:slug ──────────────────────────────────────────────────
// Ficha pública del detalle: config, catálogo activo, horario semanal, galería
// y las últimas 6 reseñas. 404 si ARENA no está activo. Sin datos bancarios.
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

  const [settingsRes, landingRes, itemsRes, reviewsRes] = await Promise.all([
    supabase
      .from("arena_field_settings")
      .select(
        "activo, politica_cancelacion, cancelacion_horas_limite, anticipacion_min_horas, anticipacion_max_dias, disciplinas, terrenos, edad_minima"
      )
      .eq("field_id", field.id)
      .maybeSingle(),
    // ponytail: consulta aparte porque estas columnas son opcionales
    // (supabase/sql/arena_landing.sql puede no estar corrido).
    supabase
      .from("arena_field_settings")
      .select("fotos_landing")
      .eq("field_id", field.id)
      .maybeSingle(),
    supabase
      .from("arena_items")
      .select(
        "id, tipo, es_base, nombre, descripcion, incluye, precio_centavos, unidad, disciplina, duracion_min, min_jugadores, max_jugadores, max_por_reserva, fotos_urls, orden"
      )
      .eq("field_id", field.id)
      .eq("activo", true)
      .order("orden", { ascending: true }),
    supabase
      .from("field_reviews")
      .select("rating, comentario, created_at, users(alias, nombre)")
      .eq("field_id", field.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  // Un error de lectura no puede parecer "ARENA inactivo": sería un 404 falso.
  for (const [etiqueta, r] of [["settings", settingsRes], ["items", itemsRes], ["resenas", reviewsRes]]) {
    if (r.error) {
      console.error(`[arena:public] ficha ${etiqueta}:`, r.error.message);
      return res.status(500).json({ error: "Error interno del servidor", code: `ficha_${etiqueta}` });
    }
  }
  if (!settingsRes.data || !settingsRes.data.activo) {
    return res.status(404).json({ error: "Este campo no acepta reservas en línea.", code: "arena_inactivo" });
  }

  return res.json({
    field: {
      ...field,
      galeria_urls: Array.isArray(field.galeria_urls) ? field.galeria_urls : [],
    },
    arena: {
      ...settingsRes.data,
      disciplinas: settingsRes.data.disciplinas || [],
      terrenos: settingsRes.data.terrenos || [],
      // Sin proveedor configurado ARENA no cobra: el botón RESERVAR se oculta.
      reservas_habilitadas: Boolean(arenaProvider()),
      fotos_landing: Array.isArray(landingRes.data?.fotos_landing)
        ? landingRes.data.fotos_landing
        : [],
    },
    items: itemsRes.data || [],
    resenas: (reviewsRes.data || []).map((r) => ({
      alias: r.users?.alias || r.users?.nombre || "Jugador",
      rating: r.rating,
      comentario: r.comentario,
      fecha: r.created_at,
    })),
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

// ─── POST /arena/checkout ─────────────────────────────────────────────────────
// Carrito completo: todas las reservas en una transacción y UN solo pago por
// el total. El front público siempre pasa por aquí; POST /bookings se queda
// para la reserva manual del dueño.
router.post("/checkout", ipRateLimit(10), optionalAuth, async (req, res) => {
  const b = req.body || {};
  if (b.acepta_politica !== true) {
    return res.status(400).json({ error: "Tienes que aceptar la política de cancelación." });
  }

  const parsed = parseCarrito(b);
  if (parsed.error) {
    return res.status(parsed.code === "carrito_duplicado" ? 409 : 400).json({
      error: parsed.error,
      ...(parsed.code ? { code: parsed.code } : {}),
      ...(parsed.reserva_index === undefined ? {} : { reserva_index: parsed.reserva_index }),
    });
  }

  try {
    const { reservas, pago, checkout, total_centavos } = await crearCheckoutCarrito({
      reservas: parsed.reservas,
      contacto: parsed.contacto,
      userId: req.userId || null,
      origen: b.origen === "app" ? "app" : "web",
    });

    return res.status(201).json({
      payment_id: pago.id,
      access_token: pago.access_token,
      checkout_url: pago.checkout_url,
      ...(checkout.client_secret ? { client_secret: checkout.client_secret } : {}),
      total_centavos,
      expires_at: reservas.map((r) => r.expires_at).filter(Boolean).sort()[0] || null,
      reservas: reservas.map((r) => ({
        codigo: r.codigo,
        field_id: r.field_id,
        fecha: r.fecha,
        total_centavos: r.total_centavos,
      })),
    });
  } catch (err) {
    return sendArenaError(res, err, "arena_create_checkout");
  }
});

// ─── GET /arena/checkout/:paymentId?t= ────────────────────────────────────────
// Confirmación del carrito: estado del pago y una ficha por reserva con su QR.
// Un token que no corresponde responde 404, igual que un pago inexistente.
router.get("/checkout/:paymentId", async (req, res) => {
  const noEncontrado = () =>
    res.status(404).json({ error: "No encontramos ese pago.", code: "pago_no_encontrado" });

  const id = String(req.params.paymentId || "").trim();
  if (!UUID.test(id)) return noEncontrado();

  const { data: pago, error } = await supabase
    .from("arena_payments")
    .select("id, status, monto_centavos, access_token, booking_id, checkout_url, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[arena:public] checkout:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!pago || !comparaToken(req.query.t, pago.access_token)) return noEncontrado();

  const { data: ligadas } = await supabase
    .from("arena_bookings")
    .select("id")
    .eq("payment_id", pago.id)
    .order("fecha", { ascending: true });
  const ids = new Set((ligadas || []).map((b) => b.id));
  if (pago.booking_id) ids.add(pago.booking_id);

  const detalles = (await Promise.all(Array.from(ids).map((bookingId) => leerReserva({ bookingId }))))
    .filter(Boolean)
    .sort((a, b) => String(a.booking.fecha).localeCompare(String(b.booking.fecha)));

  return res.json({
    status: pago.status,
    payment_id: pago.id,
    total_centavos: pago.monto_centavos,
    checkout_url: pago.checkout_url,
    contacto_email: detalles[0]?.booking.contacto_email ?? null,
    reservas: detalles.map((d) => {
      const horas = dayHours(d.field?.horarios_json, d.booking.fecha);
      const visible =
        QR_VISIBLE.includes(d.booking.status) && d.booking.pago_status !== "pendiente";
      return {
        codigo: d.booking.codigo,
        access_token: d.booking.access_token,
        fecha: d.booking.fecha,
        num_jugadores: d.booking.num_jugadores,
        status: d.booking.status,
        pago_status: d.booking.pago_status,
        total_centavos: d.booking.total_centavos,
        items: d.items.map((i) => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
          subtotal_centavos: i.subtotal_centavos,
        })),
        campo: d.field
          ? {
              id: d.field.id,
              nombre: d.field.nombre,
              slug: d.field.slug,
              ciudad: d.field.ciudad,
              direccion: d.field.direccion,
              maps_url: d.field.maps_url,
              apertura: horas?.apertura ?? null,
              cierre: horas?.cierre ?? null,
            }
          : null,
        ...(visible ? { qr_url: checkinUrl(d.booking.qr_token) } : {}),
      };
    }),
  });
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
