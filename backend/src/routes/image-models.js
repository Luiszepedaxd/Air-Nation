const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

function mapPricing(m) {
  const raw = m.pricing?.image || m.pricing?.completion || "?";
  if (typeof raw === "object" && raw !== null) return JSON.stringify(raw);
  return raw;
}

router.get("/sample", requireAdmin, async (req, res) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return res.status(200).json({ sample: [] });
  }

  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!response.ok) {
      return res.status(200).json({ sample: [] });
    }
    const { data } = await response.json();
    const list = Array.isArray(data) ? data : [];
    return res.status(200).json({ sample: list.slice(0, 3) });
  } catch {
    return res.status(200).json({ sample: [] });
  }
});

router.get("/", requireAdmin, async (req, res) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return res.status(200).json({ models: [] });
  }

  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      return res.status(200).json({ models: [] });
    }

    const { data } = await response.json();
    const list = Array.isArray(data) ? data : [];

    const imageModels = list.filter((model) => {
      const modality = model.architecture?.modality || "";
      const inputModalities = model.architecture?.input_modalities || [];
      const outputModalities = model.architecture?.output_modalities || [];

      return (
        outputModalities.includes("image") ||
        modality === "text->image" ||
        modality === "image->image" ||
        modality.includes("->image")
      );
    });

    const seen = new Set();
    const models = imageModels
      .filter((m) => {
        if (!m?.id || typeof m.id !== "string" || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .map((m) => ({
        id: m.id,
        label: m.name ?? m.id,
        provider: m.id.split("/")[0],
        pricing: mapPricing(m),
      }))
      .sort((a, b) => a.provider.localeCompare(b.provider));

    return res.status(200).json({ models });
  } catch {
    return res.status(200).json({ models: [] });
  }
});

module.exports = router;
