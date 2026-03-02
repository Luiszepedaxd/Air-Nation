const express = require("express");
const router = express.Router();

// GET /api/v1/teams — listar equipos (paginado)
router.get("/", async (req, res) => {
  try {
    // TODO: conectar a Supabase
    // const { data, error } = await supabase.from("teams").select("*")
    res.json({ teams: [], message: "Próximamente — conectar Supabase" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/teams/:id — detalle de un equipo
router.get("/:id", async (req, res) => {
  try {
    res.json({ team: null, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/teams — registrar equipo
router.post("/", async (req, res) => {
  try {
    const { name, city, description } = req.body;
    if (!name || !city) {
      return res.status(400).json({ error: "Nombre y ciudad son requeridos" });
    }
    // TODO: insertar en Supabase
    res.status(201).json({ message: "Equipo registrado", team: { name, city, description } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
