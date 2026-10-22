const express = require("express");
const supabase = require("../../lib/supabase");
const { requireAdmin } = require("../../middleware/requireAdmin");
const { UUID } = require("../../middleware/requireFieldMember");
const { dayKey } = require("../../services/joulie/time");
const { avisoCuentaLigada, avisoLiquidacion } = require("../../lib/arena/notify");
const { sendArenaError } = require("../../lib/arena/errors");
const { generarPasswordTemporal } = require("../../lib/arena/ownerAccounts");

const router = express.Router();

const PLANES = ["free", "premium", "pro"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Liga (o reactiva) una cuenta como dueña del campo. */
function ligarDueno(fieldId, userId, adminId) {
  return supabase
    .from("arena_field_members")
    .upsert(
      { field_id: fieldId, user_id: userId, rol: "owner", status: "activo", invited_by: adminId },
      { onConflict: "field_id,user_id" }
    )
    .select("id, user_id, rol, status, created_at")
    .maybeSingle();
}

function fieldIdOr400(req, res) {
  const id = String(req.params.fieldId || "").trim();
  if (!UUID.test(id)) {
    res.status(400).json({ error: "Campo inválido" });
    return null;
  }
  return id;
}

// ─── GET /arena/admin/fields ──────────────────────────────────────────────────
// Campos con su estado ARENA, dueños ligados y reservas próximas.
router.get("/fields", requireAdmin, async (req, res) => {
  const hoy = dayKey(Date.now());

  const [fieldsRes, settingsRes, membersRes, bookingsRes] = await Promise.all([
    supabase
      .from("fields")
      .select("id, nombre, slug, ciudad, status, es_prueba")
      .order("nombre", { ascending: true }),
    supabase.from("arena_field_settings").select("*"),
    supabase.from("arena_field_members").select("field_id, user_id, rol, status, created_at"),
    // ponytail: contamos en JS. Con miles de reservas conviene una vista agregada.
    supabase
      .from("arena_bookings")
      .select("field_id")
      .gte("fecha", hoy)
      .in("status", ["confirmada", "completada"]),
  ]);

  for (const r of [fieldsRes, settingsRes, membersRes, bookingsRes]) {
    if (r.error) {
      console.error("[arena:admin] fields:", r.error.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  }

  const memberIds = Array.from(new Set((membersRes.data || []).map((m) => m.user_id)));
  const usersRes = memberIds.length
    ? await supabase.from("users").select("id, nombre, alias, email").in("id", memberIds)
    : { data: [], error: null };
  if (usersRes.error) {
    console.error("[arena:admin] users:", usersRes.error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  const porUsuario = new Map((usersRes.data || []).map((u) => [u.id, u]));
  const porCampo = new Map((settingsRes.data || []).map((s) => [s.field_id, s]));
  const miembros = new Map();
  for (const m of membersRes.data || []) {
    const u = porUsuario.get(m.user_id) || {};
    const lista = miembros.get(m.field_id) || [];
    lista.push({
      user_id: m.user_id,
      rol: m.rol,
      status: m.status,
      created_at: m.created_at,
      nombre: u.nombre ?? null,
      alias: u.alias ?? null,
      email: u.email ?? null,
    });
    miembros.set(m.field_id, lista);
  }
  const proximas = new Map();
  for (const b of bookingsRes.data || []) {
    proximas.set(b.field_id, (proximas.get(b.field_id) || 0) + 1);
  }

  const fields = (fieldsRes.data || []).map((f) => ({
    ...f,
    arena: porCampo.get(f.id) || null,
    miembros: miembros.get(f.id) || [],
    reservas_proximas: proximas.get(f.id) || 0,
  }));

  return res.json({ fields, hoy });
});

// ─── GET /arena/admin/fields/:fieldId ─────────────────────────────────────────
// Encabezado del campo para /admin/arena/[fieldId] (el resto lo piden las
// pestañas vía /arena/owner/*). Evita que el frontend use la llave de servicio.
router.get("/fields/:fieldId", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;

  const { data: field, error } = await supabase
    .from("fields")
    .select("id, nombre, slug, ciudad, status, horarios_json")
    .eq("id", fieldId)
    .maybeSingle();
  if (error) {
    console.error("[arena:admin] field:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!field) return res.status(404).json({ error: "Campo no encontrado" });

  return res.json({ field });
});

// ─── PUT /arena/admin/fields/:fieldId/activate ────────────────────────────────
// Crea o actualiza los settings: plan, comisión y activo.
router.put("/fields/:fieldId/activate", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;

  const { plan, comision_pct, activo } = req.body || {};
  if (plan !== undefined && !PLANES.includes(plan)) {
    return res.status(400).json({ error: "El plan debe ser free, premium o pro." });
  }
  let comision;
  if (comision_pct !== undefined) {
    comision = Number(comision_pct);
    if (!Number.isFinite(comision) || comision < 0 || comision > 50) {
      return res.status(400).json({ error: "La comisión debe estar entre 0 y 50." });
    }
  }
  if (activo !== undefined && typeof activo !== "boolean") {
    return res.status(400).json({ error: "activo debe ser true o false." });
  }

  const { data: field, error: fieldError } = await supabase
    .from("fields")
    .select("id")
    .eq("id", fieldId)
    .maybeSingle();
  if (fieldError) {
    console.error("[arena:admin] activate field:", fieldError.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!field) return res.status(404).json({ error: "Campo no encontrado" });

  const row = { field_id: fieldId };
  if (plan !== undefined) row.plan = plan;
  if (comision !== undefined) row.comision_pct = comision;
  if (activo !== undefined) row.activo = activo;

  const { data, error } = await supabase
    .from("arena_field_settings")
    .upsert(row, { onConflict: "field_id" })
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[arena:admin] upsert settings:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  return res.json({ settings: data });
});

// ─── PATCH /arena/admin/fields/:fieldId/pause ─────────────────────────────────
// Apaga ARENA. Las reservas ya hechas se respetan.
router.patch("/fields/:fieldId/pause", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;

  const { data, error } = await supabase
    .from("arena_field_settings")
    .update({ activo: false })
    .eq("field_id", fieldId)
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[arena:admin] pause:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!data) return res.status(404).json({ error: "Este campo no tiene ARENA configurado." });
  return res.json({ settings: data });
});

// ─── Miembros (cuentas que administran el campo) ──────────────────────────────
router.get("/fields/:fieldId/members", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;

  const { data, error } = await supabase
    .from("arena_field_members")
    .select("id, user_id, rol, status, invited_by, created_at")
    .eq("field_id", fieldId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[arena:admin] members:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  const ids = (data || []).map((m) => m.user_id);
  const usersRes = ids.length
    ? await supabase.from("users").select("id, nombre, alias, email, avatar_url").in("id", ids)
    : { data: [] };
  const porUsuario = new Map((usersRes.data || []).map((u) => [u.id, u]));

  return res.json({
    members: (data || []).map((m) => ({ ...m, usuario: porUsuario.get(m.user_id) || null })),
  });
});

router.post("/fields/:fieldId/members", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;

  const userId = String(req.body?.user_id || "").trim();
  if (!UUID.test(userId)) return res.status(400).json({ error: "Usuario inválido" });

  const [fieldRes, userRes] = await Promise.all([
    supabase.from("fields").select("id, nombre").eq("id", fieldId).maybeSingle(),
    supabase.from("users").select("id, nombre, alias, email").eq("id", userId).maybeSingle(),
  ]);
  if (!fieldRes.data) return res.status(404).json({ error: "Campo no encontrado" });
  if (!userRes.data) return res.status(404).json({ error: "Usuario no encontrado" });

  const { data, error } = await ligarDueno(fieldId, userId, req.adminUser.id);
  if (error) {
    console.error("[arena:admin] add member:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  // El correo es complementario: si falla, la cuenta ya quedó ligada.
  avisoCuentaLigada({
    email: userRes.data.email,
    userId,
    fieldId,
    fieldNombre: fieldRes.data.nombre,
  }).catch((err) => console.error("[arena:admin] aviso cuenta ligada:", err.message));

  return res.status(201).json({ member: { ...data, usuario: userRes.data } });
});

// ─── POST /arena/admin/fields/:fieldId/owners ─────────────────────────────────
// Crea la cuenta del dueño (no se auto-registra) y la liga al campo. El
// password se genera aquí y viaja UNA sola vez en esta respuesta: no se
// guarda, no se loguea y el dueño está obligado a cambiarlo al entrar.
// Si el correo ya tiene cuenta solo se liga (nunca se le toca el password).
router.post("/fields/:fieldId/owners", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;

  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) {
    return res.status(400).json({ error: "El correo del dueño no es válido." });
  }

  const [fieldRes, existenteRes] = await Promise.all([
    supabase.from("fields").select("id, nombre").eq("id", fieldId).maybeSingle(),
    supabase.from("users").select("id, nombre, alias, email").ilike("email", email).maybeSingle(),
  ]);
  if (fieldRes.error || existenteRes.error) {
    console.error("[arena:admin] owners lookup:", (fieldRes.error || existenteRes.error).message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!fieldRes.data) return res.status(404).json({ error: "Campo no encontrado" });

  let usuario = existenteRes.data;
  let password = null;

  if (!usuario) {
    password = generarPasswordTemporal();
    const { data: creado, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { must_change_password: true },
    });
    if (authError || !creado?.user) {
      // El correo puede existir en auth sin fila en public.users todavía.
      const yaExiste = /already|exist|registered/i.test(authError?.message || "");
      console.error("[arena:admin] crear dueño:", authError?.message || "sin usuario");
      return res.status(yaExiste ? 409 : 500).json({
        error: yaExiste
          ? "Ese correo ya tiene cuenta. Pídele que inicie sesión una vez y lígalo buscándolo arriba."
          : "No se pudo crear la cuenta.",
      });
    }
    // La fila pública la crea el trigger de auth.users; el upsert la asegura
    // porque `arena_field_members.user_id` apunta a `public.users`.
    const { error: filaError } = await supabase
      .from("users")
      .upsert({ id: creado.user.id, email }, { onConflict: "id" });
    if (filaError) {
      console.error("[arena:admin] fila users del dueño:", filaError.message);
      return res.status(500).json({
        error: "La cuenta se creó pero no se pudo ligar al campo. Búscala arriba y lígala.",
      });
    }
    usuario = { id: creado.user.id, nombre: null, alias: null, email };
  }

  const { data: member, error } = await ligarDueno(fieldId, usuario.id, req.adminUser.id);
  if (error) {
    console.error("[arena:admin] ligar dueño:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  avisoCuentaLigada({
    email,
    userId: usuario.id,
    fieldId,
    fieldNombre: fieldRes.data.nombre,
  }).catch((err) => console.error("[arena:admin] aviso cuenta ligada:", err.message));

  return res.status(201).json({
    member: { ...member, usuario },
    password,
    creada: Boolean(password),
  });
});

// ─── POST /arena/admin/fields/:fieldId/owners/:userId/reset-password ──────────
// Regenera el password temporal. Solo de dueños ligados a ESE campo.
router.post("/fields/:fieldId/owners/:userId/reset-password", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;
  const userId = String(req.params.userId || "").trim();
  if (!UUID.test(userId)) return res.status(400).json({ error: "Usuario inválido" });

  const { data: member, error: memberError } = await supabase
    .from("arena_field_members")
    .select("user_id")
    .eq("field_id", fieldId)
    .eq("user_id", userId)
    .eq("status", "activo")
    .maybeSingle();
  if (memberError) {
    console.error("[arena:admin] reset lookup:", memberError.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!member) return res.status(404).json({ error: "Ese usuario no administra este campo." });

  const password = generarPasswordTemporal();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password,
    app_metadata: { must_change_password: true },
  });
  if (error) {
    console.error("[arena:admin] reset password:", error.message);
    return res.status(500).json({ error: "No se pudo cambiar el password." });
  }
  return res.json({ password });
});

router.delete("/fields/:fieldId/members/:userId", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;
  const userId = String(req.params.userId || "").trim();
  if (!UUID.test(userId)) return res.status(400).json({ error: "Usuario inválido" });

  const { data, error } = await supabase
    .from("arena_field_members")
    .update({ status: "inactivo" })
    .eq("field_id", fieldId)
    .eq("user_id", userId)
    .select("id, user_id, status")
    .maybeSingle();
  if (error) {
    console.error("[arena:admin] remove member:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!data) return res.status(404).json({ error: "Ese usuario no administra este campo." });
  return res.json({ member: data });
});

// ─── GET /arena/admin/bookings?field_id&status&desde&hasta ────────────────────
// Todas las reservas con su último pago.
router.get("/bookings", requireAdmin, async (req, res) => {
  const FECHA = /^\d{4}-\d{2}-\d{2}$/;

  let q = supabase
    .from("arena_bookings")
    .select(
      "id, codigo, field_id, fecha, num_jugadores, status, pago_status, total_centavos, comision_centavos, monto_campo_centavos, reembolso_centavos, payout_id, origen, contacto_nombre, contacto_email, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const fieldId = String(req.query.field_id || "").trim();
  if (fieldId) {
    if (!UUID.test(fieldId)) return res.status(400).json({ error: "Campo inválido" });
    q = q.eq("field_id", fieldId);
  }
  const status = String(req.query.status || "").trim();
  if (status) q = q.in("status", status.split(",").map((x) => x.trim()).filter(Boolean));
  if (FECHA.test(String(req.query.desde || ""))) q = q.gte("fecha", String(req.query.desde));
  if (FECHA.test(String(req.query.hasta || ""))) q = q.lte("fecha", String(req.query.hasta));

  const { data: bookings, error } = await q;
  if (error) {
    console.error("[arena:admin] bookings:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  const ids = (bookings || []).map((b) => b.id);
  const fieldIds = Array.from(new Set((bookings || []).map((b) => b.field_id)));
  const [pagosRes, camposRes] = await Promise.all([
    ids.length
      ? supabase
          .from("arena_payments")
          .select("booking_id, provider, provider_ref, status, monto_centavos, created_at")
          .in("booking_id", ids)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    fieldIds.length
      ? supabase.from("fields").select("id, nombre, slug").in("id", fieldIds)
      : Promise.resolve({ data: [] }),
  ]);

  const ultimoPago = new Map();
  for (const p of pagosRes.data || []) {
    if (!ultimoPago.has(p.booking_id)) ultimoPago.set(p.booking_id, p);
  }
  const campos = new Map((camposRes.data || []).map((f) => [f.id, f]));

  return res.json({
    reservas: (bookings || []).map((b) => ({
      ...b,
      campo: campos.get(b.field_id) || null,
      pago: ultimoPago.get(b.id) || null,
    })),
    hoy: dayKey(Date.now()),
  });
});

// ─── GET /arena/admin/payouts/pendientes ──────────────────────────────────────
// Saldo por liquidar por campo. Mismo criterio que arena_create_payout:
// reservas pagadas, con fecha ya pasada y sin liquidación previa.
router.get("/payouts/pendientes", requireAdmin, async (req, res) => {
  const hoy = dayKey(Date.now());

  const [bookingsRes, payoutsRes] = await Promise.all([
    supabase
      .from("arena_bookings")
      .select("field_id, fecha, total_centavos, comision_centavos, monto_campo_centavos, reembolso_centavos")
      .is("payout_id", null)
      .lt("fecha", hoy)
      .in("pago_status", ["pagado", "reembolso_parcial"])
      .in("status", ["confirmada", "completada", "no_show"]),
    supabase
      .from("arena_payouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (bookingsRes.error) {
    console.error("[arena:admin] payouts pendientes:", bookingsRes.error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (payoutsRes.error) {
    console.error("[arena:admin] payouts:", payoutsRes.error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }

  const porCampo = new Map();
  for (const b of bookingsRes.data || []) {
    const acc = porCampo.get(b.field_id) || {
      field_id: b.field_id,
      reservas: 0,
      bruto_centavos: 0,
      comision_centavos: 0,
      reembolsos_centavos: 0,
      neto_centavos: 0,
      desde: b.fecha,
      hasta: b.fecha,
    };
    acc.reservas += 1;
    acc.bruto_centavos += b.total_centavos;
    acc.comision_centavos += b.comision_centavos;
    acc.reembolsos_centavos += b.reembolso_centavos;
    acc.neto_centavos += Math.max(b.monto_campo_centavos - b.reembolso_centavos, 0);
    if (b.fecha < acc.desde) acc.desde = b.fecha;
    if (b.fecha > acc.hasta) acc.hasta = b.fecha;
    porCampo.set(b.field_id, acc);
  }

  const fieldIds = Array.from(
    new Set([...porCampo.keys(), ...(payoutsRes.data || []).map((p) => p.field_id)])
  );
  const [camposRes, settingsRes] = await Promise.all([
    fieldIds.length
      ? supabase.from("fields").select("id, nombre, slug").in("id", fieldIds)
      : Promise.resolve({ data: [] }),
    fieldIds.length
      ? supabase
          .from("arena_field_settings")
          .select("field_id, banco, clabe, titular_cuenta")
          .in("field_id", fieldIds)
      : Promise.resolve({ data: [] }),
  ]);
  const campos = new Map((camposRes.data || []).map((f) => [f.id, f]));
  const bancos = new Map((settingsRes.data || []).map((s) => [s.field_id, s]));

  return res.json({
    pendientes: Array.from(porCampo.values())
      .map((p) => ({
        ...p,
        campo: campos.get(p.field_id) || null,
        banco: bancos.get(p.field_id) || null,
      }))
      .sort((a, b) => b.neto_centavos - a.neto_centavos),
    liquidaciones: (payoutsRes.data || []).map((p) => ({
      ...p,
      campo: campos.get(p.field_id) || null,
      banco: bancos.get(p.field_id) || null,
    })),
    hoy,
  });
});

// ─── POST /arena/admin/fields/:fieldId/payouts ────────────────────────────────
router.post("/fields/:fieldId/payouts", requireAdmin, async (req, res) => {
  const fieldId = fieldIdOr400(req, res);
  if (!fieldId) return;

  const hasta = String(req.body?.hasta || "").trim();
  if (hasta && !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
    return res.status(400).json({ error: "La fecha debe venir como YYYY-MM-DD." });
  }

  // arena_create_payout no tiene DEFAULT en p_hasta: se mandan los tres
  // parámetros y la función aplica LEAST(COALESCE(p_hasta, ayer), ayer).
  const { data, error } = await supabase.rpc("arena_create_payout", {
    p_field_id: fieldId,
    p_hasta: hasta || null,
    p_created_by: req.adminUser.id,
  });
  if (error) return sendArenaError(res, error, "arena_create_payout");

  const payoutId = Array.isArray(data) ? data[0] : data;
  const { data: payout } = await supabase
    .from("arena_payouts")
    .select("*")
    .eq("id", payoutId)
    .maybeSingle();

  return res.status(201).json({ payout });
});

// ─── PATCH /arena/admin/payouts/:id ───────────────────────────────────────────
// Marca la liquidación como transferida con su folio y avisa al dueño.
router.patch("/payouts/:id", requireAdmin, async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!UUID.test(id)) return res.status(400).json({ error: "Liquidación inválida" });

  const referencia = String(req.body?.referencia || "").trim();
  if (!referencia) return res.status(400).json({ error: "Escribe el folio de la transferencia." });

  const { data: payout, error } = await supabase
    .from("arena_payouts")
    .update({
      status: "transferido",
      referencia: referencia.slice(0, 120),
      transferido_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pendiente")
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[arena:admin] patch payout:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
  if (!payout) {
    return res.status(409).json({ error: "Esa liquidación ya estaba transferida." });
  }

  avisoLiquidacion({ payout, fieldId: payout.field_id }).catch((e) =>
    console.error("[arena:admin] aviso liquidación:", e.message)
  );

  return res.json({ payout });
});

module.exports = router;
