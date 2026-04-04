const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

const IMAGE_MODELS = [
  { id: "openai/dall-e-3", label: "DALL·E 3", provider: "OpenAI", quality: "Alta" },
  {
    id: "black-forest-labs/flux-pro",
    label: "Flux Pro",
    provider: "Black Forest Labs",
    quality: "Alta",
  },
  {
    id: "black-forest-labs/flux-schnell",
    label: "Flux Schnell",
    provider: "Black Forest Labs",
    quality: "Rápido",
  },
  {
    id: "stability/stable-diffusion-xl-base-1.0",
    label: "SDXL",
    provider: "Stability AI",
    quality: "Media",
  },
];

router.get("/", requireAdmin, (req, res) => {
  res.json({ models: IMAGE_MODELS });
});

module.exports = router;
