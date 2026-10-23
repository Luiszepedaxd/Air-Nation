const express = require("express");
const supabase = require("../lib/supabase");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

const VALID_ROLES = new Set(["player", "admin", "field_owner"]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/v1/admin/users/:userId/role
 * Body: { app_role: 'player' | 'admin' | 'field_owner' }
 */
router.patch("/:userId/role", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const app_role =
      typeof req.body?.app_role === "string" ? req.body.app_role.trim() : "";

    if (!UUID_RE.test(userId)) {
      return res.status(400).json({ error: "userId inválido" });
    }
    if (!VALID_ROLES.has(app_role)) {
      return res.status(400).json({ error: "Rol inválido" });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ app_role })
      .eq("id", userId)
      .select("id, app_role")
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (!data) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ user: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
