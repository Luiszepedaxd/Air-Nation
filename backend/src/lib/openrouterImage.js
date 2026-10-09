// Generación de imágenes vía OpenRouter Image API (POST /api/v1/images).
// La guía vigente devuelve data[].b64_json y, cuando puede, media_type.
// La foto no se persiste: el route solo la reenvía al admin.

const OPENROUTER_IMAGES_URL = "https://openrouter.ai/api/v1/images";
const TIMEOUT_MS = 180_000;
const MODEL_MAX = 200;

const MEDIA_EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function validateFotoInput(prompt, model) {
  if (typeof prompt !== "string" || prompt.trim() === "") {
    return { status: 400, error: "Escribe un prompt." };
  }
  if (typeof model !== "string" || model.trim() === "") {
    return { status: 400, error: "Escribe el modelo de OpenRouter." };
  }
  const slug = model.trim();
  if (slug.length > MODEL_MAX || /[\s\u0000-\u001f]/.test(slug)) {
    return { status: 400, error: "Modelo inválido. Revisa el slug de OpenRouter." };
  }
  return { prompt: prompt.trim(), model: slug };
}

function normalizeMediaType(value) {
  if (typeof value !== "string") return "";
  const type = value.split(";")[0].trim().toLowerCase();
  if (type === "image/jpg") return "image/jpeg";
  return MEDIA_EXT[type] ? type : "";
}

function sniffMediaType(b64) {
  let buf;
  try {
    buf = Buffer.from(String(b64).slice(0, 64), "base64");
  } catch {
    return "";
  }
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  const start = buf.toString("utf8").trimStart().toLowerCase();
  if (start.startsWith("<svg") || start.startsWith("<?xml")) return "image/svg+xml";
  return "";
}

function imageFromOpenRouter(json) {
  const item = json && Array.isArray(json.data) ? json.data[0] : null;
  if (!item || typeof item.b64_json !== "string") return null;
  let raw = item.b64_json.trim();
  let mediaType = normalizeMediaType(item.media_type);
  const dataUrl = raw.match(/^data:([^;,]+)(;base64)?,([\s\S]+)$/i);
  if (dataUrl) {
    mediaType = mediaType || normalizeMediaType(dataUrl[1]);
    raw = dataUrl[3];
  }
  raw = raw.replace(/\s/g, "");
  if (!raw || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return null;
  mediaType = mediaType || sniffMediaType(raw);
  if (!mediaType) return null;
  return { mediaType, b64: raw, ext: MEDIA_EXT[mediaType] };
}

function upstreamMessage(bodyText) {
  let message = "";
  try {
    const parsed = JSON.parse(bodyText);
    const err = parsed && parsed.error;
    if (typeof err === "string") message = err;
    else if (err && typeof err.message === "string") message = err.message;
  } catch {
    message = typeof bodyText === "string" ? bodyText : "";
  }
  return message
    .replace(/sk-or-[A-Za-z0-9_-]+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function mapUpstreamError(status, bodyText) {
  const message = upstreamMessage(bodyText);
  const credit = status === 402 || /credit|insufficient|quota|payment required|billing/i.test(message);
  if (credit) return { status: 402, error: "Sin crédito en OpenRouter." };
  const invalidModel =
    status === 404 ||
    /not a valid model|invalid model|no endpoints found|model .*not found|unknown model|is not available/i.test(
      message
    );
  if (invalidModel) {
    return { status: 400, error: "Modelo inválido. Revisa el slug de OpenRouter." };
  }
  if (status === 401 || status === 403) {
    return { status: 502, error: "OpenRouter rechazó la clave." };
  }
  return {
    status: 502,
    error: message ? `OpenRouter: ${message}` : "OpenRouter no pudo generar la imagen.",
  };
}

async function generateAdminImage({ prompt, model }) {
  const input = validateFotoInput(prompt, model);
  if (input.error) return input;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { status: 500, error: "Falta OPENROUTER_API_KEY en el servidor." };
  }

  let response;
  try {
    response = await fetch(OPENROUTER_IMAGES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://airnation.online",
        "X-Title": "AirNation Generar fotos",
      },
      body: JSON.stringify({ model: input.model, prompt: input.prompt }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return { status: 504, error: "OpenRouter tardó demasiado en generar la imagen." };
    }
    return { status: 502, error: "No se pudo contactar a OpenRouter." };
  }

  const text = await response.text();
  if (!response.ok) return mapUpstreamError(response.status, text);

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    return { status: 502, error: "La respuesta de OpenRouter no trajo imagen." };
  }
  const image = imageFromOpenRouter(json);
  if (!image) {
    return { status: 502, error: "La respuesta de OpenRouter no trajo imagen." };
  }
  return { status: 200, mediaType: image.mediaType, b64: image.b64, ext: image.ext };
}

module.exports = {
  validateFotoInput,
  imageFromOpenRouter,
  mapUpstreamError,
  generateAdminImage,
};
