const express = require("express");
const multer = require("multer");
const { uploadToCloudflare, uploadVideoToR2 } = require("../services/cloudflare");
const { requireAuth } = require("../middleware/requireAuth");

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

const videoMimes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const VIDEO_MAX_DURATION_SEC = 30;

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
      ok: true,
      cf_account_id: Boolean(process.env.CF_ACCOUNT_ID),
      cf_stream_token: Boolean(process.env.CF_STREAM_API_TOKEN),
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
      const video_url = await uploadVideoToR2(
        req.file.buffer,
        req.file.originalname || "video.mp4",
        req.file.mimetype
      );
      return res.status(200).json({
        video_url,
        video_mp4_url: video_url,
        thumbnail_url: null,
        duration_s: 0,
      });
    } catch (e) {
      console.error("[upload/video] error:", e?.message, e?.stack);
      return res.status(500).json({ error: e.message || "Error al subir el video" });
    }
  });
});

module.exports = router;
