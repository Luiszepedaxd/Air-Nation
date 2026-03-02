const express = require("express");
const router = express.Router();

// GET /api/v1/users/:id
router.get("/:id", (req, res) => res.json({ user: null, id: req.params.id }));

// POST /api/v1/users/register
router.post("/register", (req, res) => {
  const { username, email, team_id } = req.body;
  if (!username || !email) return res.status(400).json({ error: "Username y email requeridos" });
  // TODO: crear usuario en Supabase Auth + tabla users
  res.status(201).json({ message: "Usuario registrado", user: { username, email } });
});

module.exports = router;
