const express = require("express");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { uploadToCloudflare, uploadVideoToStream } = require("../services/cloudflare");
const { requireAuth } = require("../middleware/requireAuth");
const {
  ensureFfmpegPaths,
  trimVideoBuffer,
} = require("../lib/videoTrim");
const { inspectImageUpload } = require("../lib/imageUpload");

ensureFfmpegPaths();

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const videoMimes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mp4",
]);

/** Strip ";codecs=…" so MediaRecorder / Safari mime strings still pass. */
function baseMime(mimetype) {
  return String(mimetype || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

function isAllowedVideoMime(mimetype) {
  return videoMimes.has(baseMime(mimetype));
}

/** Source videos for server trim can be long phone recordings. */
const VIDEO_MAX_BYTES = 250 * 1024 * 1024;
const VIDEO_MAX_DURATION_SEC = 60;

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VIDEO_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (isAllowedVideoMime(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Solo se permiten video/mp4, video/quicktime, video/webm o audio/mpeg, audio/wav"
        )
      );
    }
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_MAX_BYTES },
});

/**
 * Probe media duration (seconds) via ffprobe. Writes buffer to a temp file.
 * Hard-timeout so a missing/broken ffprobe never hangs POST /upload/video.
 * @returns {Promise<number|null>}
 */
const FFPROBE_TIMEOUT_MS = 15000;

function probeDurationSeconds(buffer, originalname) {
  const ext = path.extname(originalname || "") || ".mp4";
  const tmpPath = path.join(
    os.tmpdir(),
    `airnation-video-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  );

  const probePromise = fs.promises.writeFile(tmpPath, buffer).then(
    () =>
      new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tmpPath, (err, data) => {
          if (err) return reject(err);
          const raw =
            data && data.format && data.format.duration != null
              ? Number(data.format.duration)
              : NaN;
          if (!Number.isFinite(raw) || raw <= 0) {
            return resolve(null);
          }
          resolve(raw);
        });
      })
  );

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`ffprobe timeout after ${FFPROBE_TIMEOUT_MS}ms`));
    }, FFPROBE_TIMEOUT_MS);
  });

  return Promise.race([probePromise, timeoutPromise]).finally(() => {
    fs.promises.unlink(tmpPath).catch(() => {});
  });
}

function parsePositiveNumber(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1000) / 1000;
}

const router = express.Router();

router.get("/video/health", (req, res) => {
  try {
    return res.status(200).json({
      ok: true,
      cloudflare_account_id: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID),
      cloudflare_api_token: Boolean(process.env.CLOUDFLARE_API_TOKEN),
      cf_account_id: Boolean(process.env.CF_ACCOUNT_ID),
      cf_stream_token: Boolean(process.env.CF_STREAM_API_TOKEN),
      stream_ready: Boolean(
        (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID) &&
          (process.env.CF_STREAM_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN)
      ),
      video_max_duration_sec: VIDEO_MAX_DURATION_SEC,
      video_max_bytes: VIDEO_MAX_BYTES,
      server_trim: true,
    });
  } catch (e) {
    console.error("[upload/video/health]", e);
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "La foto pesa más de 10 MB. Elige una más liviana." });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }
    const inspected = inspectImageUpload(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
    if (inspected.error) {
      return res.status(400).json({ error: inspected.error });
    }
    try {
      const url = await uploadToCloudflare(
        inspected.buffer,
        inspected.filename,
        inspected.mimetype
      );
      if (!url || typeof url !== "string") {
        return res.status(502).json({ error: "No se pudo guardar la foto." });
      }
      return res.status(200).json({ url });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
});

router.post("/video", requireAuth, (req, res) => {
  uploadVideo.single("file")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "El archivo excede el tamaño máximo (250MB)" });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }
    try {
      const DURATION_SLACK_SEC = 2;
      const body = req.body || {};

      // Optional server-side trim window (preferred over client MediaRecorder).
      const trimStart = parsePositiveNumber(body.trim_start_s ?? body.start_s);
      const trimDuration = parsePositiveNumber(
        body.trim_duration_s ?? body.clip_duration_s
      );
      // Client only sends trim_* when the selected window needs cutting.
      const wantsTrim =
        trimStart != null && trimDuration != null && trimDuration > 0;

      let uploadBuffer = req.file.buffer;
      let uploadName = req.file.originalname || "video.mp4";
      let uploadMime = baseMime(req.file.mimetype) || "video/mp4";

      if (wantsTrim && trimDuration > VIDEO_MAX_DURATION_SEC + 0.05) {
        return res.status(400).json({
          error: `El video no puede durar más de ${VIDEO_MAX_DURATION_SEC} segundos (1 minuto).`,
        });
      }

      if (wantsTrim) {
        const safeDur = Math.min(trimDuration, VIDEO_MAX_DURATION_SEC);
        console.log(
          `[upload/video] server trim start=${trimStart}s duration=${safeDur}s srcBytes=${uploadBuffer.length}`
        );
        try {
          const trimmed = await trimVideoBuffer(
            uploadBuffer,
            uploadName,
            trimStart,
            safeDur
          );
          uploadBuffer = trimmed.buffer;
          uploadName = trimmed.filename;
          uploadMime = trimmed.mimetype;
          console.log(
            `[upload/video] trim ok outBytes=${uploadBuffer.length} mime=${uploadMime}`
          );
        } catch (trimErr) {
          console.error(
            "[upload/video] trim failed:",
            trimErr && trimErr.message ? trimErr.message : trimErr
          );
          return res.status(500).json({
            error:
              "No se pudo recortar el video en el servidor. Inténtalo de nuevo o prueba otro archivo.",
          });
        }
      }

      // Soft-fail probe with timeout: never hang POST /upload/video.
      // Stream-copy trims often probe slightly over requested -t (keyframe drift),
      // so trust the trimmer-reported duration when it is within the product max.
      let probed_s = 0;
      try {
        const probed = await probeDurationSeconds(uploadBuffer, uploadName);
        if (probed != null) {
          probed_s = Math.round(probed * 1000) / 1000;
        }
      } catch (probeErr) {
        console.error(
          "[upload/video] ffprobe skipped:",
          probeErr && probeErr.message ? probeErr.message : probeErr
        );
      }

      const rawClient =
        body.duration_s != null ? Number(body.duration_s) : NaN;
      const client_s =
        Number.isFinite(rawClient) && rawClient > 0
          ? Math.round(rawClient * 1000) / 1000
          : wantsTrim && trimDuration
            ? Math.min(trimDuration, VIDEO_MAX_DURATION_SEC)
            : 0;

      const clientWithinMax =
        client_s > 0 && client_s <= VIDEO_MAX_DURATION_SEC + 0.05;

      let duration_s = 0;
      if (clientWithinMax) {
        duration_s = client_s;
      } else if (probed_s > 0) {
        duration_s = probed_s;
      } else if (client_s > 0) {
        duration_s = client_s;
      }

      const limitForReject = clientWithinMax
        ? VIDEO_MAX_DURATION_SEC + DURATION_SLACK_SEC
        : VIDEO_MAX_DURATION_SEC + 0.05;
      const measured = probed_s > 0 ? probed_s : duration_s;
      if (!clientWithinMax && measured > limitForReject) {
        return res.status(400).json({
          error: `El video no puede durar más de ${VIDEO_MAX_DURATION_SEC} segundos (1 minuto).`,
        });
      }
      if (
        clientWithinMax &&
        probed_s > VIDEO_MAX_DURATION_SEC + DURATION_SLACK_SEC
      ) {
        // Clip claimed <=60s from trimmer but file is clearly longer — reject.
        return res.status(400).json({
          error: `El video no puede durar más de ${VIDEO_MAX_DURATION_SEC} segundos (1 minuto).`,
        });
      }
      if (
        duration_s > VIDEO_MAX_DURATION_SEC &&
        duration_s <= VIDEO_MAX_DURATION_SEC + DURATION_SLACK_SEC
      ) {
        duration_s = VIDEO_MAX_DURATION_SEC;
      }

      const stream = await uploadVideoToStream(
        uploadBuffer,
        uploadName,
        uploadMime,
        // Mismo margen que aceptamos arriba: un trim por keyframes puede
        // quedar unas décimas sobre 60s y Stream rechaza lo que exceda el tope.
        { maxDurationSeconds: VIDEO_MAX_DURATION_SEC + DURATION_SLACK_SEC }
      );
      if (!stream.video_url) {
        return res
          .status(502)
          .json({ error: "Cloudflare Stream no devolvió una URL de reproducción" });
      }
      // Stream mide la duración real tras codificar: preferirla cuando existe.
      if (
        stream.duration_s != null &&
        stream.duration_s > 0 &&
        stream.duration_s <= VIDEO_MAX_DURATION_SEC + DURATION_SLACK_SEC
      ) {
        duration_s = Math.min(
          Math.round(stream.duration_s * 1000) / 1000,
          VIDEO_MAX_DURATION_SEC
        );
      }
      return res.status(200).json({
        video_url: stream.video_url,
        video_mp4_url: stream.video_mp4_url,
        thumbnail_url: stream.thumbnail_url,
        duration_s,
        stream_uid: stream.stream_uid,
        trimmed: Boolean(wantsTrim),
      });
    } catch (e) {
      console.error("[upload/video] error:", e?.message, e?.stack);
      return res.status(500).json({ error: e.message || "Error al subir el video" });
    }
  });
});

module.exports = router;
