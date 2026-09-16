const express = require("express");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { uploadToCloudflare, uploadVideoToStream } = require("../services/cloudflare");
const { requireAuth } = require("../middleware/requireAuth");

try {
  const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
  if (ffprobeInstaller && ffprobeInstaller.path) {
    ffmpeg.setFfprobePath(ffprobeInstaller.path);
  }
} catch (_) {
  /* system ffprobe may still be available */
}

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

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
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const VIDEO_MAX_DURATION_SEC = 60;

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VIDEO_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (videoMimes.has(file.mimetype)) {
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten image/jpeg, image/png o image/webp"));
    }
  },
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
    });
  } catch (e) {
    console.error("[upload/video/health]", e);
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
});

router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }
    try {
      const url = await uploadToCloudflare(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
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
        return res.status(400).json({ error: "El archivo excede el tamaño máximo (100MB)" });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ningún archivo" });
    }
    try {
      // Soft-fail probe with timeout: never hang POST /upload/video.
      // Stream-copy trims often probe slightly over requested -t (keyframe drift),
      // so trust the trimmer-reported duration when it is within the product max.
      const DURATION_SLACK_SEC = 2;
      let probed_s = 0;
      try {
        const probed = await probeDurationSeconds(
          req.file.buffer,
          req.file.originalname || "video.mp4"
        );
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
        req.body && req.body.duration_s != null
          ? Number(req.body.duration_s)
          : NaN;
      const client_s =
        Number.isFinite(rawClient) && rawClient > 0
          ? Math.round(rawClient * 1000) / 1000
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
        req.file.buffer,
        req.file.originalname || "video.mp4",
        req.file.mimetype,
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
      });
    } catch (e) {
      console.error("[upload/video] error:", e?.message, e?.stack);
      return res.status(500).json({ error: e.message || "Error al subir el video" });
    }
  });
});

module.exports = router;
