const express = require("express");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { uploadToCloudflare, uploadVideoToR2 } = require("../services/cloudflare");
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
      cf_account_id: Boolean(process.env.CF_ACCOUNT_ID),
      cf_stream_token: Boolean(process.env.CF_STREAM_API_TOKEN),
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
      // Prefer ffprobe; fall back to client-reported duration_s from the form.
      let duration_s = 0;
      try {
        const probed = await probeDurationSeconds(
          req.file.buffer,
          req.file.originalname || "video.mp4"
        );
        if (probed != null) {
          duration_s = Math.round(probed * 1000) / 1000;
        }
      } catch (probeErr) {
        console.error(
          "[upload/video] ffprobe skipped:",
          probeErr && probeErr.message ? probeErr.message : probeErr
        );
      }

      if (!(duration_s > 0)) {
        const rawClient =
          req.body && req.body.duration_s != null
            ? Number(req.body.duration_s)
            : NaN;
        if (Number.isFinite(rawClient) && rawClient > 0) {
          duration_s = Math.round(rawClient * 1000) / 1000;
        }
      }

      if (duration_s > VIDEO_MAX_DURATION_SEC + 0.05) {
        return res.status(400).json({
          error: `El video no puede durar más de ${VIDEO_MAX_DURATION_SEC} segundos (1 minuto).`,
        });
      }

      const video_url = await uploadVideoToR2(
        req.file.buffer,
        req.file.originalname || "video.mp4",
        req.file.mimetype
      );
      return res.status(200).json({
        video_url,
        video_mp4_url: video_url,
        thumbnail_url: null,
        duration_s,
      });
    } catch (e) {
      console.error("[upload/video] error:", e?.message, e?.stack);
      return res.status(500).json({ error: e.message || "Error al subir el video" });
    }
  });
});

module.exports = router;
