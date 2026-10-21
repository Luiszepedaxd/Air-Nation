const supabase = require("../lib/supabase");
const { requireAuth } = require("./requireAuth");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Requiere sesión y que el usuario pueda operar el campo de `:fieldId`
 * (miembro activo de `arena_field_members`, creador del campo o admin de app).
 * Deja `req.fieldId`.
 */
function requireFieldMember(req, res, next) {
  requireAuth(req, res, async () => {
    const fieldId = String(req.params.fieldId || "").trim();
    if (!UUID.test(fieldId)) {
      return res.status(400).json({ error: "Campo inválido" });
    }

    const { data, error } = await supabase.rpc("arena_is_field_member", {
      p_field_id: fieldId,
      p_user_id: req.authUser.id,
    });

    if (error) {
      console.error("[arena] arena_is_field_member:", error.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    if (data !== true) {
      return res.status(403).json({ error: "No administras este campo." });
    }

    req.fieldId = fieldId;
    next();
  });
}

module.exports = { requireFieldMember, UUID };
