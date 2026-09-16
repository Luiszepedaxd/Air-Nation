async function uploadToCloudflare(fileBuffer, filename, mimeType) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN");
  }

  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  form.append("file", blob, filename);

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const result = await res.json();
  if (result.success === true) {
    return result.result.variants[0];
  }
  const message = result.errors?.[0]?.message || "Error al subir imagen a Cloudflare";
  throw new Error(message);
}

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadVideoToR2(fileBuffer, filename, mimeType) {
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicUrl) {
    throw new Error("Faltan R2_BUCKET o R2_PUBLIC_URL");
  }
  const key = `videos/${Date.now()}-${filename}`;
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );
  return `${publicUrl}/${key}`;
}

/** Account id: acepta el nombre largo o el alias corto. */
function streamAccountId() {
  return process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || null;
}

/** Token para llamadas a Stream: preferimos el token específico de Stream. */
function streamToken() {
  return process.env.CF_STREAM_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || null;
}

const STREAM_MAX_DURATION_SEC = 60;
const STREAM_READY_TIMEOUT_MS = 120000;
const STREAM_POLL_INTERVAL_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function streamPayload(result) {
  const playback = result.playback || {};
  const duration = Number(result.duration);
  return {
    stream_uid: result.uid || null,
    video_url: playback.hls || null,
    // Stream no expone MP4 progresivo sin habilitar downloads; el player usa HLS.
    video_mp4_url: null,
    thumbnail_url: result.thumbnail || null,
    duration_s: Number.isFinite(duration) && duration > 0 ? duration : null,
  };
}

/**
 * Sube un video a Cloudflare Stream (basic upload) y espera a que esté listo.
 * @returns {Promise<{stream_uid: string|null, video_url: string|null, video_mp4_url: string|null, thumbnail_url: string|null, duration_s: number|null}>}
 */
async function uploadVideoToStream(fileBuffer, filename, mimeType, opts = {}) {
  const accountId = streamAccountId();
  const token = streamToken();
  if (!accountId || !token) {
    throw new Error(
      "Faltan CLOUDFLARE_ACCOUNT_ID/CF_ACCOUNT_ID o CLOUDFLARE_API_TOKEN/CF_STREAM_API_TOKEN"
    );
  }

  const maxDurationSeconds = opts.maxDurationSeconds || STREAM_MAX_DURATION_SEC;
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;

  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType || "video/mp4" });
  form.append("file", blob, filename || "video.mp4");
  form.append("maxDurationSeconds", String(maxDurationSeconds));

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!json || json.success !== true || !json.result || !json.result.uid) {
    const message =
      (json && json.errors && json.errors[0] && json.errors[0].message) ||
      "Error al subir el video a Cloudflare Stream";
    throw new Error(message);
  }

  const uid = json.result.uid;
  let last = json.result;

  const deadline = Date.now() + (opts.readyTimeoutMs || STREAM_READY_TIMEOUT_MS);
  while (!last.readyToStream && Date.now() < deadline) {
    await sleep(STREAM_POLL_INTERVAL_MS);
    const pollRes = await fetch(`${baseUrl}/${uid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pollJson = await pollRes.json().catch(() => null);
    if (pollJson && pollJson.success === true && pollJson.result) {
      last = pollJson.result;
      const state = last.status && last.status.state;
      if (state === "error") {
        const reason =
          (last.status && (last.status.errReasonText || last.status.errReasonCode)) ||
          "Cloudflare Stream no pudo procesar el video";
        throw new Error(reason);
      }
    }
  }

  // Si aún no terminó de codificar devolvemos igual: el HLS queda disponible
  // en cuanto Stream termina y el player reintenta.
  return streamPayload(last);
}

module.exports = { uploadToCloudflare, uploadVideoToR2, uploadVideoToStream };
