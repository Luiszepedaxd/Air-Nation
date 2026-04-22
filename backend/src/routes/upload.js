const express = require("express");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const fs = require("fs/promises");
const multer = require("multer");
const FormData = require("form-data");
const fluentFfmpeg = require("fluent-ffmpeg");
const { path: ffmpegPath } = require("@ffmpeg-installer/ffmpeg");
const { path: ffprobePath } = require("@ffprobe-installer/ffprobe");
const { uploadToCloudflare } = require("../services/cloudflare");
const { requireAuth } = require("../middleware/requireAuth");

fluentFfmpeg()
  .setFfmpegPath(ffmpegPath)
  .setFfprobePath(ffprobePath);

console.log("[upload/video] ffmpeg path:", ffmpegPath);
console.log("[upload/video] ffprobe path:", ffprobePath);

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

const videoMimes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const VIDEO_MAX_DURATION_SEC = 30;

const extForVideoMime = (mime) => {
  if (mime === "video/webm") return ".webm";
  if (mime === "video/quicktime") return ".mov";
  return ".mp4";
};

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VIDEO_MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (videoMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Solo se permiten video/mp4, video/quicktime o video/webm")
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

const router = express.Router();

router.get("/video/health", (req, res) => {
  try {
    return res.status(200).json({
      ffmpeg: ffmpegPath,
      ffprobe: ffprobePath,
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

function getVideoDurationSeconds(filePath) {
  return new Promise((resolve, reject) => {
    fluentFfmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      const d = metadata?.format?.duration;
      if (d == null || Number.isNaN(Number(d))) {
        return reject(new Error("No se pudo determinar la duración del video"));
      }
      resolve(Number(d));
    });
  });
}

router.post("/video", requireAuth, (req, res) => {
  uploadVideo.single("file")(req, res, async (err) => {
    const extForMime = (mime) => extForVideoMime(mime);
    let tmpPath = null;
    try {
      if (err) {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "El archivo excede el tamaño máximo (50MB)" });
        }
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No se recibió ningún archivo" });
      }

      const accountId = process.env.CF_ACCOUNT_ID;
      const streamToken = process.env.CF_STREAM_API_TOKEN;
      if (!accountId || !streamToken) {
        return res.status(500).json({
          error: "Falta configuración de Cloudflare Stream (CF_ACCOUNT_ID / CF_STREAM_API_TOKEN)",
        });
      }

      const ext = extForMime(req.file.mimetype);
      tmpPath = path.join(
        os.tmpdir(),
        `an-vid-${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`
      );

      await fs.writeFile(tmpPath, req.file.buffer);
      let durationSec;
      try {
        durationSec = await getVideoDurationSeconds(tmpPath);
      } catch (probeErr) {
        console.error(
          "[upload/video] ffprobe / duración:",
          probeErr && probeErr.message ? probeErr.message : probeErr,
          probeErr && probeErr.stack
        );
        return res.status(500).json({
          error: probeErr.message || "No se pudo leer la duración del video",
        });
      }
      if (durationSec > VIDEO_MAX_DURATION_SEC) {
        return res.status(400).json({
          error: "El video no puede durar más de 30 segundos",
        });
      }

      const form = new FormData();
      form.append("file", req.file.buffer, {
        filename: req.file.originalname || `video${ext}`,
        contentType: req.file.mimetype,
      });

      const streamUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;
      const cfRes = await fetch(streamUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${streamToken}`,
          ...form.getHeaders(),
        },
        body: form,
      });

      const data = await cfRes.json().catch(() => ({}));
      if (!cfRes.ok || !data.success) {
        const msg =
          data?.errors?.[0]?.message ||
          data?.errors?.[0] ||
          `Error de Cloudflare Stream (${cfRes.status})`;
        return res.status(502).json({ error: String(msg) });
      }

      const result = data.result;
      const video_url = result?.playback?.hls;
      const thumbnail_url = result?.thumbnail;
      if (!video_url) {
        return res.status(502).json({
          error: "Respuesta inesperada de Cloudflare Stream (sin HLS)",
        });
      }

      return res.status(200).json({
        video_url,
        thumbnail_url: thumbnail_url ?? null,
        duration_s: Math.round(durationSec),
      });
    } catch (e) {
      console.error(
        "[upload/video] error inesperado:",
        e && e.message,
        e && e.stack
      );
      return res.status(500).json({ error: e.message || "Error al procesar el video" });
    } finally {
      if (tmpPath) {
        try {
          await fs.unlink(tmpPath);
        } catch {
          // archivo ya eliminado o inexistente
        }
      }
    }
  });
});

module.exports = router;
