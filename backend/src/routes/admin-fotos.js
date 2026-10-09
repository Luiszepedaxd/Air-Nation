const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");
const { generateAdminImage } = require("../lib/openrouterImage");

const router = express.Router();

// POST /api/v1/admin/fotos
// Solo app_role = admin. No escribe storage ni base de datos.
router.post("/fotos", requireAdmin, async (req, res) => {
  try {
    const result = await generateAdminImage({
      prompt: req.body && req.body.prompt,
      model: req.body && req.body.model,
    });
    if (result.status !== 200) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json({ mediaType: result.mediaType, b64: result.b64, ext: result.ext });
  } catch (err) {
    console.error("[admin/fotos]", err && err.name ? err.name : "error");
    res.status(500).json({ error: "No se pudo generar la imagen." });
  }
});

module.exports = router;
