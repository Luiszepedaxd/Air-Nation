const express = require("express");
const multer = require("multer");
const supabase = require("../../lib/supabase");
const { requireAuth } = require("../../middleware/requireAuth");
const { requireFieldMember, UUID } = require("../../middleware/requireFieldMember");
const { dayKey } = require("../../services/joulie/time");
const { parseHorarioJson } = require("../../lib/arena/horario");
const { arenaPublicUrl } = require("../../lib/arena/config");
const { inspectImageUpload } = require("../../lib/imageUpload");
const { uploadToCloudflare } = require("../../services/cloudflare");
const { sendArenaError } = require("../../lib/arena/errors");
const {
  crearReserva,
  leerReserva,
  sanearItems,
  serializarReserva,
} = require("../../lib/arena/bookings");
const { reembolsar } = require("../../lib/arena/refunds");
const notify = require("../../lib/arena/notify");

const router = express.Router();

const TIPOS = ["paquete", "derecho_campo", "renta", "extra"];
const UNIDADES = ["por_persona", "por_reserva", "por_unidad"];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const uploadFoto = multer({ storage: multer.memoryStorage(), limits: { fileSize: IMAGE_MAX_BYTES } });

function err500(res, contexto, error) {
  console.error(`[arena:owner] ${contexto}:`, error.message);
  return res.status(500).json({ error: "Error interno del servidor" });
}

// ─── GET /arena/owner/fields ──────────────────────────────────────────────────
// Campos que administro (miembro activo o creador) con las reservas de hoy.
router.get("/fields", requireAuth, async (req, res) => {
  const hoy = dayKey(Date.now());
  const userId = req.authUser.id;

  const [memberRes, ownRes] = await Promise.all([
    supabase
      .from("arena_field_members")
      .select("field_id, rol")
      .eq("user_id", userId)
      .eq("status", "activo"),
    supabase.from("fields").select("id").eq("created_by", userId),
  ]);
  if (memberRes.error) return err500(res, "owner fields members", memberRes.error);
  if (ownRes.error) return err500(res, "owner fields propios", ownRes.error);

  const ids = Array.from(
    new Set([...(memberRes.data || []).map((m) => m.field_id), ...(ownRes.data || []).map((f) => f.id)])
  );
  if (ids.length === 0) return res.json({ fields: [], hoy });

  const [fieldsRes, settingsRes, bookingsRes] = await Promise.all([
    supabase.from("fields").select("id, nombre, slug, ciudad, status, horarios_json").in("id", ids),
    supabase.from("arena_field_settings").select("*").in("field_id", ids),
    supabase
      .from("arena_bookings")
      .select("field_id, status")
      .in("field_id", ids)
      .eq("fecha", hoy)
      .in("status", ["confirmada", "completada"]),
  ]);
  if (fieldsRes.error) return err500(res, "owner fields", fieldsRes.error);
  if (settingsRes.error) return err500(res, "owner settings", settingsRes.error);
  if (bookingsRes.error) return err500(res, "owner bookings hoy", bookingsRes.error);

  const porCampo = new Map((settingsRes.data || []).map((s) => [s.field_id, s]));
  const hoyPorCampo = new Map();
  for (const b of bookingsRes.data || []) {
    const acc = hoyPorCampo.get(b.field_id) || { total: 0, completadas: 0 };
    acc.total += 1;
    if (b.status === "completada") acc.completadas += 1;
    hoyPorCampo.set(b.field_id, acc);
  }

  const fields = (fieldsRes.data || []).map((f) => ({
    ...f,
    arena: porCampo.get(f.id) || null,
    reservas_hoy: hoyPorCampo.get(f.id)?.total || 0,
    llegadas_hoy: hoyPorCampo.get(f.id)?.completadas || 0,
  }));

  return res.json({ fields, hoy });
});

// ─── Configuración del campo (sin plan ni comisión: eso solo admin) ───────────
router.get("/fields/:fieldId/settings", requireFieldMember, async (req, res) => {
  const { data, error } = await supabase
    .from("arena_field_settings")
    .select("*")
    .eq("field_id", req.fieldId)
    .maybeSingle();
  if (error) return err500(res, "get settings", error);
  if (!data) return res.status(404).json({ error: "Este campo no tiene ARENA configurado." });
  return res.json({ settings: data });
});

const ENTEROS_SETTINGS = {
  anticipacion_min_horas: [0, 720, "La anticipación mínima debe estar entre 0 y 720 horas."],
  anticipacion_max_dias: [1, 365, "La anticipación máxima debe estar entre 1 y 365 días."],
  cancelacion_horas_limite: [0, 720, "El plazo de cancelación debe estar entre 0 y 720 horas."],
};

const TEXTOS_SETTINGS = {
  politica_cancelacion: 2000,
  email_avisos: 200,
  telefono_avisos: 40,
  banco: 80,
  titular_cuenta: 120,
};

router.patch("/fields/:fieldId/settings", requireFieldMember, async (req, res) => {
  const body = req.body || {};
  const row = {};

  for (const [key, [min, max, mensaje]] of Object.entries(ENTEROS_SETTINGS)) {
    if (body[key] === undefined) continue;
    const n = Number(body[key]);
    if (!Number.isInteger(n) || n < min || n > max) return res.status(400).json({ error: mensaje });
    row[key] = n;
  }

  for (const [key, max] of Object.entries(TEXTOS_SETTINGS)) {
    if (body[key] === undefined) continue;
    const v = body[key] === null ? null : String(body[key]).trim();
    if (v && v.length > max) {
      return res.status(400).json({ error: `El campo ${key} no puede pasar de ${max} caracteres.` });
    }
    row[key] = v || null;
  }

  if (body.email_avisos !== undefined && row.email_avisos && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email_avisos)) {
    return res.status(400).json({ error: "El email de avisos no es válido." });
  }

  if (body.clabe !== undefined) {
    const clabe = body.clabe === null ? null : String(body.clabe).replace(/\s/g, "");
    if (clabe && !/^[0-9]{18}$/.test(clabe)) {
      return res.status(400).json({ error: "La CLABE debe tener exactamente 18 dígitos." });
    }
    row.clabe = clabe || null;
  }

  if (Object.keys(row).length === 0) {
    return res.status(400).json({ error: "No hay nada que actualizar." });
  }

  const { data, error } = await supabase
    .from("arena_field_settings")
    .update(row)
    .eq("field_id", req.fieldId)
    .select("*")
    .maybeSingle();
  if (error) return err500(res, "patch settings", error);
  if (!data) return res.status(404).json({ error: "Este campo no tiene ARENA configurado." });
  return res.json({ settings: data });
});

// ─── Catálogo ─────────────────────────────────────────────────────────────────
/** @returns {{ row: object } | { error: string }} */
function parseItem(body, { partial }) {
  const row = {};
  const tiene = (k) => body[k] !== undefined;

  if (!partial || tiene("tipo")) {
    if (!TIPOS.includes(body.tipo)) {
      return { error: "El tipo debe ser paquete, derecho_campo, renta o extra." };
    }
    row.tipo = body.tipo;
  }
  if (!partial || tiene("nombre")) {
    const nombre = String(body.nombre ?? "").trim();
    if (nombre.length < 1 || nombre.length > 80) {
      return { error: "El nombre es obligatorio y no puede pasar de 80 caracteres." };
    }
    row.nombre = nombre;
  }
  if (tiene("descripcion")) {
    const d = body.descripcion === null ? null : String(body.descripcion).trim();
    if (d && d.length > 1000) return { error: "La descripción no puede pasar de 1000 caracteres." };
    row.descripcion = d || null;
  }
  if (tiene("incluye")) {
    if (!Array.isArray(body.incluye)) return { error: "«Qué incluye» debe ser una lista." };
    const incluye = body.incluye.map((x) => String(x ?? "").trim()).filter(Boolean);
    if (incluye.length > 20) return { error: "«Qué incluye» admite hasta 20 puntos." };
    if (incluye.some((x) => x.length > 120)) {
      return { error: "Cada punto de «Qué incluye» admite hasta 120 caracteres." };
    }
    row.incluye = incluye;
  }
  if (!partial || tiene("precio_centavos")) {
    const precio = Number(body.precio_centavos);
    if (!Number.isInteger(precio) || precio < 0 || precio > 100000000) {
      return { error: "El precio debe ser un entero de centavos válido." };
    }
    row.precio_centavos = precio;
  }
  if (!partial || tiene("unidad")) {
    const unidad = body.unidad ?? "por_persona";
    if (!UNIDADES.includes(unidad)) {
      return { error: "La unidad debe ser por_persona, por_reserva o por_unidad." };
    }
    row.unidad = unidad;
  }
  for (const key of ["min_jugadores", "max_jugadores", "max_por_reserva"]) {
    if (!tiene(key)) continue;
    if (body[key] === null || body[key] === "") {
      row[key] = null;
      continue;
    }
    const n = Number(body[key]);
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      return { error: `${key} debe ser un entero entre 1 y 500.` };
    }
    row[key] = n;
  }
  if (
    row.min_jugadores != null &&
    row.max_jugadores != null &&
    row.max_jugadores < row.min_jugadores
  ) {
    return { error: "El máximo de jugadores no puede ser menor que el mínimo." };
  }
  if (tiene("fotos_urls")) {
    if (!Array.isArray(body.fotos_urls)) return { error: "Las fotos deben ser una lista de URLs." };
    const fotos = body.fotos_urls.map((x) => String(x ?? "").trim()).filter(Boolean);
    if (fotos.length > 6) return { error: "Hasta 6 fotos por concepto." };
    if (fotos.some((u) => !/^https?:\/\//i.test(u))) return { error: "Las fotos deben ser URLs válidas." };
    row.fotos_urls = fotos;
  }
  if (tiene("activo")) {
    if (typeof body.activo !== "boolean") return { error: "activo debe ser true o false." };
    row.activo = body.activo;
  }
  if (tiene("orden")) {
    const n = Number(body.orden);
    if (!Number.isInteger(n) || n < 0 || n > 9999) return { error: "El orden debe ser un entero." };
    row.orden = n;
  }
  if (partial && Object.keys(row).length === 0) return { error: "No hay nada que actualizar." };
  return { row };
}

router.get("/fields/:fieldId/items", requireFieldMember, async (req, res) => {
  const { data, error } = await supabase
    .from("arena_items")
    .select("*")
    .eq("field_id", req.fieldId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return err500(res, "get items", error);
  return res.json({ items: data || [] });
});

router.post("/fields/:fieldId/items", requireFieldMember, async (req, res) => {
  const parsed = parseItem(req.body || {}, { partial: false });
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const { data, error } = await supabase
    .from("arena_items")
    .insert({ ...parsed.row, field_id: req.fieldId })
    .select("*")
    .maybeSingle();
  if (error) return err500(res, "post item", error);
  return res.status(201).json({ item: data });
});

router.patch("/fields/:fieldId/items/:id", requireFieldMember, async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!UUID.test(id)) return res.status(400).json({ error: "Concepto inválido" });

  const parsed = parseItem(req.body || {}, { partial: true });
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const { data, error } = await supabase
    .from("arena_items")
    .update(parsed.row)
    .eq("id", id)
    .eq("field_id", req.fieldId)
    .select("*")
    .maybeSingle();
  if (error) return err500(res, "patch item", error);
  if (!data) return res.status(404).json({ error: "Concepto no encontrado" });
  return res.json({ item: data });
});

// Un concepto que ya salió en una reserva no se borra: se desactiva, para no
// perder el histórico del renglón.
router.delete("/fields/:fieldId/items/:id", requireFieldMember, async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!UUID.test(id)) return res.status(400).json({ error: "Concepto inválido" });

  const { data: existente, error: existeError } = await supabase
    .from("arena_items")
    .select("id")
    .eq("id", id)
    .eq("field_id", req.fieldId)
    .maybeSingle();
  if (existeError) return err500(res, "delete item lookup", existeError);
  if (!existente) return res.status(404).json({ error: "Concepto no encontrado" });

  const { data: usado, error: usadoError } = await supabase
    .from("arena_booking_items")
    .select("id")
    .eq("item_id", id)
    .limit(1);
  if (usadoError) return err500(res, "delete item usado", usadoError);

  if (usado && usado.length > 0) {
    const { error } = await supabase
      .from("arena_items")
      .update({ activo: false })
      .eq("id", id)
      .eq("field_id", req.fieldId);
    if (error) return err500(res, "delete item desactivar", error);
    return res.json({ desactivado: true });
  }

  const { error } = await supabase
    .from("arena_items")
    .delete()
    .eq("id", id)
    .eq("field_id", req.fieldId);
  if (error) return err500(res, "delete item", error);
  return res.json({ eliminado: true });
});

// ─── Fotos ────────────────────────────────────────────────────────────────────
router.post("/fields/:fieldId/uploads", requireFieldMember, (req, res) => {
  uploadFoto.single("file")(req, res, async (multerError) => {
    if (multerError) {
      if (multerError instanceof multer.MulterError && multerError.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "La foto pesa más de 10 MB. Elige una más liviana." });
      }
      return res.status(400).json({ error: multerError.message });
    }
    if (!req.file) return res.status(400).json({ error: "No se recibió ninguna foto" });

    const inspected = inspectImageUpload(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (inspected.error) return res.status(400).json({ error: inspected.error });

    try {
      const url = await uploadToCloudflare(inspected.buffer, inspected.filename, inspected.mimetype);
      if (!url || typeof url !== "string") {
        return res.status(502).json({ error: "No se pudo guardar la foto." });
      }
      return res.json({ url });
    } catch (e) {
      console.error("[arena:owner] upload:", e.message);
      return res.status(500).json({ error: "No se pudo guardar la foto." });
    }
  });
});

// ─── Horario semanal (el mismo de la ficha del campo) ─────────────────────────
router.patch("/fields/:fieldId/horario", requireFieldMember, async (req, res) => {
  const parsed = parseHorarioJson(req.body?.horarios_json ?? req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const { data, error } = await supabase
    .from("fields")
    .update({ horarios_json: parsed.json })
    .eq("id", req.fieldId)
    .select("id, horarios_json")
    .maybeSingle();
  if (error) return err500(res, "patch horario", error);
  if (!data) return res.status(404).json({ error: "Campo no encontrado" });
  return res.json({ horarios_json: data.horarios_json });
});

// ─── Días cerrados ────────────────────────────────────────────────────────────
router.get("/fields/:fieldId/blackouts", requireFieldMember, async (req, res) => {
  const desde = FECHA.test(String(req.query.desde || "")) ? String(req.query.desde) : dayKey(Date.now());
  const { data, error } = await supabase
    .from("arena_blackouts")
    .select("id, fecha, motivo, created_at")
    .eq("field_id", req.fieldId)
    .gte("fecha", desde)
    .order("fecha", { ascending: true });
  if (error) return err500(res, "get blackouts", error);
  return res.json({ blackouts: data || [] });
});

router.post("/fields/:fieldId/blackouts", requireFieldMember, async (req, res) => {
  const fecha = String(req.body?.fecha || "").trim();
  if (!FECHA.test(fecha)) return res.status(400).json({ error: "La fecha debe venir como YYYY-MM-DD." });
  const motivo = req.body?.motivo ? String(req.body.motivo).trim().slice(0, 200) : null;

  const { data, error } = await supabase
    .from("arena_blackouts")
    .upsert(
      { field_id: req.fieldId, fecha, motivo, created_by: req.authUser.id },
      { onConflict: "field_id,fecha" }
    )
    .select("id, fecha, motivo, created_at")
    .maybeSingle();
  if (error) return err500(res, "post blackout", error);
  return res.status(201).json({ blackout: data });
});

router.delete("/fields/:fieldId/blackouts/:id", requireFieldMember, async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!UUID.test(id)) return res.status(400).json({ error: "Día cerrado inválido" });

  const { data, error } = await supabase
    .from("arena_blackouts")
    .delete()
    .eq("id", id)
    .eq("field_id", req.fieldId)
    .select("id")
    .maybeSingle();
  if (error) return err500(res, "delete blackout", error);
  if (!data) return res.status(404).json({ error: "Día cerrado no encontrado" });
  return res.json({ eliminado: true });
});

// ─── Agenda ───────────────────────────────────────────────────────────────────
// GET /arena/owner/fields/:fieldId/bookings?desde&hasta&status
router.get("/fields/:fieldId/bookings", requireFieldMember, async (req, res) => {
  const hoy = dayKey(Date.now());
  const desde = FECHA.test(String(req.query.desde || "")) ? String(req.query.desde) : hoy;
  const hasta = FECHA.test(String(req.query.hasta || "")) ? String(req.query.hasta) : desde;
  if (hasta < desde) return res.status(400).json({ error: "El rango de fechas no es válido.", code: "rango_invalido" });

  let q = supabase
    .from("arena_bookings")
    .select(
      "id, codigo, fecha, num_jugadores, jugadores_llegaron, status, pago_status, total_centavos, comision_centavos, monto_campo_centavos, reembolso_centavos, contacto_nombre, contacto_email, contacto_telefono, notas_jugador, notas_internas, origen, checkin_at, cancelada_por, motivo_cancelacion, expires_at, created_at, qr_token"
    )
    .eq("field_id", req.fieldId)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true })
    .order("created_at", { ascending: true });

  const status = String(req.query.status || "").trim();
  if (status) {
    const lista = status.split(",").map((x) => x.trim()).filter(Boolean);
    q = q.in("status", lista);
  } else {
    // Por defecto la agenda no muestra basura sin pagar.
    q = q.in("status", ["confirmada", "completada", "no_show", "pendiente_pago"]);
  }

  const { data: bookings, error } = await q;
  if (error) return err500(res, "agenda", error);

  const ids = (bookings || []).map((b) => b.id);
  const itemsRes = ids.length
    ? await supabase
        .from("arena_booking_items")
        .select("booking_id, nombre, tipo, unidad, cantidad, precio_unit_centavos, subtotal_centavos")
        .in("booking_id", ids)
    : { data: [] };
  const porReserva = new Map();
  for (const i of itemsRes.data || []) {
    const lista = porReserva.get(i.booking_id) || [];
    lista.push(i);
    porReserva.set(i.booking_id, lista);
  }

  const reservas = (bookings || []).map(({ id, qr_token, ...b }) => ({
    ...b,
    items: porReserva.get(id) || [],
    // El dueño es staff del campo: puede abrir el check-in de sus reservas.
    qr_token: ["confirmada", "completada"].includes(b.status) ? qr_token : null,
    id,
  }));

  const esperados = reservas
    .filter((b) => ["confirmada", "completada"].includes(b.status))
    .reduce((n, b) => n + b.num_jugadores, 0);
  const llegaron = reservas
    .filter((b) => b.status === "completada")
    .reduce((n, b) => n + (b.jugadores_llegaron ?? b.num_jugadores), 0);

  return res.json({ reservas, desde, hasta, hoy, esperados, llegaron });
});

// ─── Reserva manual (las que llegan por WhatsApp) ─────────────────────────────
// POST /arena/owner/fields/:fieldId/bookings → link de pago que vence en 2 h.
router.post("/fields/:fieldId/bookings", requireFieldMember, async (req, res) => {
  const b = req.body || {};
  if (!FECHA.test(String(b.fecha || ""))) {
    return res.status(400).json({ error: "La fecha debe venir como YYYY-MM-DD." });
  }
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 20) {
    return res.status(400).json({ error: "Elige un paquete o un derecho de campo.", code: "falta_item_base" });
  }

  const items = sanearItems(b.items);

  try {
    const { booking, pago } = await crearReserva({
      p_field_id: req.fieldId,
      p_fecha: String(b.fecha),
      p_num_jugadores: Number(b.num_jugadores),
      p_items: items,
      p_contacto_nombre: String(b.contacto_nombre || "").slice(0, 120),
      p_contacto_email: String(b.contacto_email || "").slice(0, 200),
      p_contacto_telefono: b.contacto_telefono ? String(b.contacto_telefono).slice(0, 40) : null,
      p_user_id: null,
      p_origen: "manual",
      p_notas_jugador: b.notas_jugador ? String(b.notas_jugador).slice(0, 500) : null,
      p_created_by: req.authUser.id,
    });

    const detalle = await leerReserva({ bookingId: booking.id });
    const linkPago = pago?.checkout_url || null;
    if (detalle) {
      notify
        .avisoLinkPago(detalle, linkPago)
        .catch((e) => console.error("[arena] aviso link de pago:", e.message));
    }

    return res.status(201).json({
      codigo: booking.codigo,
      total_centavos: booking.total_centavos,
      expires_at: booking.expires_at,
      // Para copiar a WhatsApp.
      link_pago: linkPago,
      link_reserva: `${arenaPublicUrl()}/reservas/${booking.codigo}?t=${booking.access_token}`,
    });
  } catch (err) {
    return sendArenaError(res, err, "reserva manual");
  }
});

// ─── PATCH /arena/owner/fields/:fieldId/bookings/:id/status ───────────────────
// accion: "cancelar" (reembolso 100%) o "no_show".
router.patch("/fields/:fieldId/bookings/:id/status", requireFieldMember, async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!UUID.test(id)) return res.status(400).json({ error: "Reserva inválida" });

  const accion = String(req.body?.accion || "").trim();
  if (!["cancelar", "no_show"].includes(accion)) {
    return res.status(400).json({ error: "La acción debe ser cancelar o no_show." });
  }

  const { data: booking, error: leerError } = await supabase
    .from("arena_bookings")
    .select("*")
    .eq("id", id)
    .eq("field_id", req.fieldId)
    .maybeSingle();
  if (leerError) return err500(res, "status lookup", leerError);
  if (!booking) {
    return res.status(404).json({ error: "No encontramos esa reserva.", code: "reserva_no_encontrada" });
  }

  if (accion === "no_show") {
    // Solo el día de la reserva o después: antes todavía puede llegar.
    if (booking.fecha > dayKey(Date.now())) {
      return res.status(409).json({ error: "Todavía no es el día de la reserva.", code: "transicion_invalida" });
    }
    const { data: marcada, error } = await supabase
      .from("arena_bookings")
      .update({ status: "no_show" })
      .eq("id", id)
      .eq("field_id", req.fieldId)
      .eq("status", "confirmada")
      .select("*")
      .maybeSingle();
    if (error) return err500(res, "no_show", error);
    if (!marcada) {
      return res.status(409).json({ error: "Esa reserva no se puede marcar como no-show.", code: "transicion_invalida" });
    }
    const detalle = await leerReserva({ bookingId: id });
    return res.json({ reserva: detalle ? serializarReserva(detalle) : null });
  }

  const { data: cancelada, error } = await supabase
    .from("arena_bookings")
    .update({
      status: "cancelada",
      cancelada_at: new Date().toISOString(),
      cancelada_por: "campo",
      motivo_cancelacion: req.body?.motivo ? String(req.body.motivo).slice(0, 300) : null,
      expires_at: null,
    })
    .eq("id", id)
    .eq("field_id", req.fieldId)
    .in("status", ["confirmada", "pendiente_pago"])
    .select("*")
    .maybeSingle();
  if (error) return err500(res, "cancelar campo", error);
  if (!cancelada) {
    return res.status(409).json({ error: "Esa reserva ya no se puede cancelar.", code: "transicion_invalida" });
  }

  // Si cancela el campo el reembolso es siempre del 100%, sin plazo.
  const r = await reembolsar(cancelada, { motivo: "cancelación del campo" });
  const detalle = await leerReserva({ bookingId: id });
  if (detalle) {
    notify
      .avisoCanceladaPorCampo(detalle)
      .catch((e) => console.error("[arena] aviso cancelación campo:", e.message));
  }

  return res.json({
    reserva: detalle ? serializarReserva(detalle) : null,
    reembolso_centavos: r.monto_centavos,
    reembolso_manual: Boolean(r.manual),
  });
});

// ─── GET /arena/owner/fields/:fieldId/saldos ──────────────────────────────────
router.get("/fields/:fieldId/saldos", requireFieldMember, async (req, res) => {
  const [bookingsRes, payoutsRes] = await Promise.all([
    supabase
      .from("arena_bookings")
      .select("total_centavos, comision_centavos, monto_campo_centavos, reembolso_centavos, payout_id, fecha, status, pago_status")
      .eq("field_id", req.fieldId)
      .in("pago_status", ["pagado", "reembolsado", "reembolso_parcial"]),
    supabase
      .from("arena_payouts")
      .select("*")
      .eq("field_id", req.fieldId)
      .order("created_at", { ascending: false }),
  ]);
  if (bookingsRes.error) return err500(res, "saldos", bookingsRes.error);
  if (payoutsRes.error) return err500(res, "saldos payouts", payoutsRes.error);

  const hoy = dayKey(Date.now());
  const saldos = {
    vendido_centavos: 0,
    comision_centavos: 0,
    reembolsado_centavos: 0,
    por_liquidar_centavos: 0,
    liquidado_centavos: 0,
    reservas_por_liquidar: 0,
  };

  for (const b of bookingsRes.data || []) {
    if (b.pago_status === "reembolsado") {
      saldos.reembolsado_centavos += b.reembolso_centavos;
      continue;
    }
    saldos.vendido_centavos += b.total_centavos;
    saldos.comision_centavos += b.comision_centavos;
    saldos.reembolsado_centavos += b.reembolso_centavos;
    const neto = Math.max(b.monto_campo_centavos - b.reembolso_centavos, 0);
    if (b.payout_id) {
      saldos.liquidado_centavos += neto;
    } else if (b.fecha < hoy && ["confirmada", "completada", "no_show"].includes(b.status)) {
      // Solo se liquida lo que ya pasó, igual que arena_create_payout.
      saldos.por_liquidar_centavos += neto;
      saldos.reservas_por_liquidar += 1;
    }
  }

  return res.json({ saldos, liquidaciones: payoutsRes.data || [], hoy });
});

module.exports = router;
