const express = require("express");
const router = express.Router();

// GET /api/v1/docs — listar documentos oficiales por autoridad
router.get("/", (req, res) => {
  const { authority } = req.query; // ?authority=GN | SSP | SCT | PM
  // TODO: filtrar desde Supabase
  res.json({
    docs: [],
    authorities: ["Guardia Nacional", "SSP", "SCT", "Policía Municipal"],
    filter: authority || "all"
  });
});

// POST /api/v1/docs — subir documento oficial (admin only)
router.post("/", (req, res) => {
  const { title, authority, file_url } = req.body;
  if (!title || !authority || !file_url) {
    return res.status(400).json({ error: "Título, autoridad y URL del archivo son requeridos" });
  }
  // TODO: insertar en Supabase (verificar rol admin)
  res.status(201).json({ message: "Documento subido", doc: { title, authority, file_url } });
});

module.exports = router;
