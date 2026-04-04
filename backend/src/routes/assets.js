const express = require("express");
const supabase = require("../lib/supabase");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

// PATCH /api/v1/assets/:id
// Body: { image_url: string }
router.patch("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { image_url } = req.body || {};

  if (!image_url || typeof image_url !== "string") {
    return res.status(400).json({ error: "image_url requerida" });
  }

  const { data, error } = await supabase
    .from("site_assets")
    .update({ image_url, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

module.exports = router;
