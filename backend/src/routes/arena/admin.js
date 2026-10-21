const express = require("express");
const supabase = require("../../lib/supabase");
const { requireAdmin } = require("../../middleware/requireAdmin");
const { UUID } = require("../../middleware/requireFieldMember");
const { dayKey } = require("../../services/joulie/time");
const { avisoCuentaLigada } = require("../../lib/arena/notify");

const router = express.Router();

const PLANES = ["free", "premium", "pro"];

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
      .select("id, nombre, slug, ciudad, status")
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

  const { data, error } = await supabase
    .from("arena_field_members")
    .upsert(
      { field_id: fieldId, user_id: userId, rol: "owner", status: "activo", invited_by: req.adminUser.id },
      { onConflict: "field_id,user_id" }
    )
    .select("id, user_id, rol, status, created_at")
    .maybeSingle();
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

module.exports = router;
