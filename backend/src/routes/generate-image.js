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
      console.log("FULL CHOICES:", JSON.stringify(orData.choices, null, 2));
      console.log("OpenRouter response:", JSON.stringify(orData, null, 2));

      const message = orData.choices?.[0]?.message;
      const content = message?.content;
      const reasoningDetails = message?.reasoning_details || [];

      console.log("Content type:", typeof content);
      console.log("Content value:", JSON.stringify(content, null, 2));

      // Buscar imagen en content (array o string)
      if (Array.isArray(content)) {
        const imageBlock = content.find(
          (b) =>
            b &&
            (b.type === "image_url" ||
              b.type === "image" ||
              b.image_url ||
              b.data)
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
        } else if (imageBlock?.data) {
          imageBase64 = imageBlock.data;
        }
      } else if (typeof content === "string" && content.startsWith("data:")) {
        const [meta, b64] = content.split(",");
        imageMimeType = meta.match(/data:([^;]+)/)?.[1] || "image/png";
        imageBase64 = b64;
      }

      // Si no se encontró en content, buscar en reasoning_details
      if (!imageUrl && !imageBase64) {
        // Buscar imagen en reasoning_details — tomar el ÚLTIMO elemento con data
        const imageDetails = reasoningDetails.filter((d) => d?.data);
        if (imageDetails.length > 0) {
          const lastImageDetail = imageDetails[imageDetails.length - 1];
          imageBase64 = lastImageDetail.data;
          imageMimeType = "image/png";
        }
      }
      if (!imageUrl && !imageBase64) {
        for (const detail of reasoningDetails) {
          if (detail?.image_url?.url) {
            const dataUrl = detail.image_url.url;
            if (dataUrl.startsWith("data:")) {
              const [meta, b64] = dataUrl.split(",");
              imageMimeType = meta.match(/data:([^;]+)/)?.[1] || "image/png";
              imageBase64 = b64;
            } else {
              imageUrl = dataUrl;
            }
            break;
          }
        }
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
      console.log("FULL CHOICES:", JSON.stringify(orData.choices, null, 2));
      console.log("OpenRouter response:", JSON.stringify(orData, null, 2));
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

  try {
    // Si tenemos base64, detectar el tipo real por los magic bytes
    if (imageBase64) {
      const buffer = Buffer.from(imageBase64, "base64");

      // Detectar por magic bytes
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        imageMimeType = "image/jpeg";
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        imageMimeType = "image/png";
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49) {
        imageMimeType = "image/webp";
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
        imageMimeType = "image/gif";
      } else {
        // fallback: intentar jpeg
        imageMimeType = "image/jpeg";
      }

      const filename = `${(assetKey || "asset").replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.${imageMimeType.split("/")[1]}`;
      console.log("mimeType detectado:", imageMimeType);
      console.log("buffer primeros bytes:", buffer.slice(0, 4).toString("hex"));
      console.log("base64 primeros 20 chars:", imageBase64?.substring(0, 20));
      const cloudflareUrl = await uploadToCloudflare(buffer, filename, imageMimeType);
      return res.json({ url: cloudflareUrl });
    }

    if (imageUrl) {
      // Descargar imagen desde URL y subir a Cloudflare
      const imgRes = await fetch(imageUrl);
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
      const filename = `${(assetKey || "asset").replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.${ext}`;
      console.log("mimeType detectado:", contentType);
      console.log("buffer primeros bytes:", buffer.slice(0, 4).toString("hex"));
      console.log("base64 primeros 20 chars:", imageBase64?.substring(0, 20));
      const cloudflareUrl = await uploadToCloudflare(buffer, filename, contentType);
      return res.json({ url: cloudflareUrl });
    }

    return res.status(500).json({ error: "No se recibió URL ni imagen en base64" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
