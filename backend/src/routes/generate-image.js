const express = require("express");
const { uploadToCloudflare } = require("../services/cloudflare");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

const SYSTEM_CONTEXT = `Fotografía profesional para plataforma de airsoft en México llamada AirNation.
Estilo: fotografía editorial de acción, iluminación natural, colores vibrantes pero realistas.
Sin texto, sin logos, sin marcas de agua. Alta resolución, composición profesional.`;

const TIMEOUT_MS = 60_000;

function getTimeoutSignal(ms) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function isModelImageUnsupportedMessage(msg) {
  const lower = String(msg).toLowerCase();
  return (
    lower.includes("does not support") ||
    lower.includes("image generation") ||
    lower.includes("no image") ||
    lower.includes("not support image") ||
    lower.includes("invalid model") ||
    lower.includes("unknown model") ||
    (lower.includes("model") && lower.includes("image") && lower.includes("not"))
  );
}

router.post("/", requireAdmin, async (req, res) => {
  const { prompt, model, assetKey } = req.body || {};
  if (!prompt || !model) {
    return res.status(400).json({ error: "prompt y model son requeridos" });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY no configurada" });
  }

  const enrichedPrompt = `${SYSTEM_CONTEXT} ${prompt}`;

  let orRes;
  try {
    orRes = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://airnation.online",
        "X-Title": "AirNation CMS",
      },
      body: JSON.stringify({
        model,
        prompt: enrichedPrompt,
        n: 1,
        size: "1792x1024",
        response_format: "url",
      }),
      signal: getTimeoutSignal(TIMEOUT_MS),
    });
  } catch (e) {
    if (e && (e.name === "AbortError" || e.code === "ABORT_ERR")) {
      return res.status(504).json({
        error: "La generación tardó demasiado. Intenta con un modelo más rápido.",
      });
    }
    console.error(e);
    return res.status(500).json({ error: e.message || "Error al contactar OpenRouter" });
  }

  const rawText = await orRes.text();
  let parsed;
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    parsed = {};
  }

  if (!orRes.ok) {
    const errObj = parsed.error;
    const msg =
      (typeof errObj === "string" ? errObj : errObj?.message) ||
      (typeof parsed.message === "string" ? parsed.message : null) ||
      rawText ||
      "Error en OpenRouter";

    if (orRes.status === 402) {
      return res.status(402).json({ error: "Créditos insuficientes en OpenRouter" });
    }
    if (orRes.status === 429) {
      return res
        .status(429)
        .json({ error: "Límite de requests alcanzado. Intenta en unos minutos." });
    }
    if (
      (orRes.status === 400 || orRes.status === 404 || orRes.status === 422) &&
      isModelImageUnsupportedMessage(msg)
    ) {
      return res
        .status(400)
        .json({ error: "Este modelo no genera imágenes. Selecciona otro." });
    }

    return res.status(orRes.status >= 400 && orRes.status < 600 ? orRes.status : 500).json({
      error: typeof msg === "string" ? msg : "Error en OpenRouter",
    });
  }

  const item = parsed.data?.[0];
  if (!item) {
    return res.status(500).json({ error: "Respuesta inválida de OpenRouter" });
  }

  let buffer;
  let mimeType = "image/png";

  if (item.url) {
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) {
      return res.status(502).json({ error: "No se pudo descargar la imagen generada" });
    }
    const arrayBuf = await imgRes.arrayBuffer();
    buffer = Buffer.from(arrayBuf);
    const ct = imgRes.headers.get("content-type");
    if (ct && ct.startsWith("image/")) {
      mimeType = ct.split(";")[0].trim();
    }
  } else if (item.b64_json) {
    buffer = Buffer.from(item.b64_json, "base64");
  } else {
    return res.status(500).json({ error: "No se recibió URL ni imagen en base64" });
  }

  const safeKey =
    (assetKey && String(assetKey).replace(/[^a-zA-Z0-9_-]/g, "_")) || "asset";
  const ext =
    mimeType === "image/jpeg" || mimeType === "image/jpg"
      ? "jpg"
      : mimeType === "image/webp"
        ? "webp"
        : "png";
  const filename = `${safeKey}-ai-${Date.now()}.${ext}`;

  try {
    const url = await uploadToCloudflare(buffer, filename, mimeType);
    return res.json({ url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
