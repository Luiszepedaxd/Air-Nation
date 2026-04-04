const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

function modalityIndicatesImage(modality) {
  if (modality == null || typeof modality !== "string") return false;
  const m = modality.trim();
  if (m === "image->image" || m === "text->image") return true;
  return m.includes("image");
}

function idIndicatesImageModel(id) {
  if (!id || typeof id !== "string") return false;
  const lower = id.toLowerCase();
  return (
    lower.includes("flux") ||
    lower.includes("dall-e") ||
    lower.includes("stable-diffusion") ||
    lower.includes("sdxl") ||
    lower.includes("imagen") ||
    lower.includes("midjourney") ||
    lower.includes("playground")
  );
}

function isImageCapableModel(model) {
  const modality = model.architecture?.modality;
  return modalityIndicatesImage(modality) || idIndicatesImageModel(model.id);
}

function mapModel(model) {
  const id = model.id;
  const rawPricing = model.pricing?.image || model.pricing?.completion || "?";
  const pricing =
    typeof rawPricing === "object" && rawPricing !== null
      ? JSON.stringify(rawPricing)
      : rawPricing;
  return {
    id,
    label: model.name ?? id,
    provider: id.split("/")[0] || "",
    pricing,
  };
}

router.get("/", requireAdmin, async (req, res) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return res.status(200).json({ models: [] });
  }

  try {
    const orRes = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!orRes.ok) {
      return res.status(200).json({ models: [] });
    }

    const body = await orRes.json();
    const list = Array.isArray(body.data) ? body.data : [];

    const seen = new Set();
    const models = [];
    for (const m of list) {
      if (!m || typeof m.id !== "string" || !m.id) continue;
      if (!isImageCapableModel(m)) continue;
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      models.push(mapModel(m));
    }

    models.sort((a, b) => a.provider.localeCompare(b.provider, undefined, { sensitivity: "base" }));

    return res.status(200).json({ models });
  } catch {
    return res.status(200).json({ models: [] });
  }
});

module.exports = router;
