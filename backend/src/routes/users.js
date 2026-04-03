const express = require("express");
const supabase = require("../lib/supabase");

const router = express.Router();

const VALID_ROLES = new Set([
  "rifleman",
  "sniper",
  "support",
  "medic",
  "scout",
  "team_leader",
  "rookie",
]);

const VALID_COMO_SE_ENTERO = new Set([
  "instagram",
  "facebook",
  "amigo",
  "google",
  "evento",
  "otro",
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// GET /api/v1/users/:id
router.get("/:id", (req, res) => res.json({ user: null, id: req.params.id }));

// POST /api/v1/users/register
router.post("/register", (req, res) => {
  const { username, email, team_id } = req.body;
  if (!username || !email) return res.status(400).json({ error: "Username y email requeridos" });
  // TODO: crear usuario en Supabase Auth + tabla users
  res.status(201).json({ message: "Usuario registrado", user: { username, email } });
});

/**
 * PATCH /api/v1/users/:id
 * @param {string} req.params.id - UUID del usuario
 * @param {string} [req.body.nombre]
 * @param {string} [req.body.alias]
 * @param {string} [req.body.ciudad]
 * @param {'rifleman'|'sniper'|'support'|'medic'|'scout'|'team_leader'|'rookie'} [req.body.rol]
 * @param {string|null} [req.body.team_id] - UUID o null
 * @param {'instagram'|'facebook'|'amigo'|'google'|'evento'|'otro'} [req.body.como_se_entero]
 * @param {string|null} [req.body.avatar_url]
 */
router.patch("/:id", async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};

    if (body.nombre !== undefined) updates.nombre = body.nombre;
    if (body.alias !== undefined) updates.alias = body.alias;
    if (body.ciudad !== undefined) updates.ciudad = body.ciudad;
    if (body.rol !== undefined) {
      if (!VALID_ROLES.has(body.rol)) {
        return res.status(400).json({ error: "Valor de rol no válido" });
      }
      updates.rol = body.rol;
    }
    if (body.team_id !== undefined) {
      if (body.team_id !== null && (typeof body.team_id !== "string" || !UUID_RE.test(body.team_id))) {
        return res.status(400).json({ error: "team_id debe ser un UUID válido o null" });
      }
      updates.team_id = body.team_id;
    }
    if (body.como_se_entero !== undefined) {
      if (!VALID_COMO_SE_ENTERO.has(body.como_se_entero)) {
        return res.status(400).json({ error: "Valor de como_se_entero no válido" });
      }
      updates.como_se_entero = body.como_se_entero;
    }
    if (body.avatar_url !== undefined) {
      if (body.avatar_url !== null && typeof body.avatar_url !== "string") {
        return res.status(400).json({ error: "avatar_url debe ser string o null" });
      }
      updates.avatar_url = body.avatar_url;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.params.id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ user: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
