const express = require("express");
const { uploadToCloudflare } = require("../services/cloudflare");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

const SYSTEM_CONTEXT = `Fotografía profesional para plataforma de airsoft en México llamada AirNation.
Estilo: fotografía editorial de acción, iluminación natural, colores vibrantes pero realistas.
Sin texto, sin logos, sin marcas de agua. Alta resolución, composición profesional.`;

const TIMEOUT_CHAT_MS = 120_000;
const TIMEOUT_IMAGES_MS = 60_000;

function getTimeoutSignal(ms) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function useChatCompletionsForModel(model) {
  if (!model || typeof model !== "string") return false;
  return (
    model.includes("gemini") ||
    model.includes("gpt-5-image") ||
    model.includes("gpt-4o") ||
    model.includes("image-preview") ||
    model.includes("image-mini")
  );
}

function openRouterHeaders() {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://airnation.online",
    "X-Title": "AirNation CMS",
  };
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

  const useChatCompletions = useChatCompletionsForModel(model);

  let imageUrl = null;
  let imageBase64 = null;
  let imageMimeType = "image/png";

  try {
    if (useChatCompletions) {
      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders(),
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: enrichedPrompt }],
          max_tokens: 4096,
        }),
        signal: getTimeoutSignal(TIMEOUT_CHAT_MS),
      });

      const errBody = orRes.ok ? null : await orRes.json().catch(() => ({}));

      if (!orRes.ok) {
        if (orRes.status === 402) {
          return res.status(402).json({ error: "Créditos insuficientes en OpenRouter" });
        }
        if (orRes.status === 429) {
          return res
            .status(429)
            .json({ error: "Límite de requests alcanzado. Intenta en unos minutos." });
        }
        const msg =
          errBody?.error?.message ||
          (typeof errBody?.error === "string" ? errBody.error : null) ||
          "Este modelo no genera imágenes. Selecciona otro.";
        return res.status(400).json({ error: msg });
      }

      const orData = await orRes.json();
      const content = orData.choices?.[0]?.message?.content;

      if (Array.isArray(content)) {
        const imageBlock = content.find(
          (b) => b && (b.type === "image_url" || b.type === "image")
        );
        if (imageBlock?.image_url?.url) {
          const dataUrl = imageBlock.image_url.url;
          if (dataUrl.startsWith("data:")) {
            const [meta, b64] = dataUrl.split(",");
            imageMimeType = meta.match(/data:([^;]+)/)?.[1] || "image/png";
            imageBase64 = b64;
          } else {
            imageUrl = dataUrl;
          }
        }
      } else if (typeof content === "string" && content.startsWith("data:")) {
        const [meta, b64] = content.split(",");
        imageMimeType = meta.match(/data:([^;]+)/)?.[1] || "image/png";
        imageBase64 = b64;
      }

      if (!imageUrl && !imageBase64) {
        return res.status(400).json({
          error: "El modelo no devolvió una imagen. Intenta con otro prompt.",
        });
      }
    } else {
      const orRes = await fetch("https://openrouter.ai/api/v1/images/generations", {
        method: "POST",
        headers: openRouterHeaders(),
        body: JSON.stringify({
          model,
          prompt: enrichedPrompt,
          n: 1,
          size: "1792x1024",
          response_format: "url",
        }),
        signal: getTimeoutSignal(TIMEOUT_IMAGES_MS),
      });

      const errBody = orRes.ok ? null : await orRes.json().catch(() => ({}));

      if (!orRes.ok) {
        if (orRes.status === 402) {
          return res.status(402).json({ error: "Créditos insuficientes en OpenRouter" });
        }
        if (orRes.status === 429) {
          return res
            .status(429)
            .json({ error: "Límite de requests alcanzado. Intenta en unos minutos." });
        }
        const msg =
          errBody?.error?.message ||
          (typeof errBody?.error === "string" ? errBody.error : null) ||
          "Este modelo no genera imágenes. Selecciona otro.";
        return res.status(400).json({ error: msg });
      }

      const orData = await orRes.json();
      const item = orData.data?.[0];
      if (item?.url) imageUrl = item.url;
      else if (item?.b64_json) imageBase64 = item.b64_json;

      if (!imageUrl && !imageBase64) {
        return res.status(400).json({
          error: "El modelo no devolvió una imagen. Intenta con otro prompt.",
        });
      }
    }
  } catch (e) {
    if (e && (e.name === "AbortError" || e.code === "ABORT_ERR")) {
      return res.status(504).json({
        error: "La generación tardó demasiado. Intenta con un modelo más rápido.",
      });
    }
    console.error(e);
    return res.status(500).json({ error: e.message || "Error al contactar OpenRouter" });
  }

  let buffer;
  let mimeType = imageMimeType;

  if (imageUrl) {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return res.status(502).json({ error: "No se pudo descargar la imagen generada" });
    }
    const arrayBuf = await imgRes.arrayBuffer();
    buffer = Buffer.from(arrayBuf);
    const ct = imgRes.headers.get("content-type");
    if (ct && ct.startsWith("image/")) {
      mimeType = ct.split(";")[0].trim();
    }
  } else if (imageBase64) {
    buffer = Buffer.from(imageBase64, "base64");
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
