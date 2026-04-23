const express = require("express");
const multer = require("multer");
const { uploadToCloudflare } = require("../services/cloudflare");
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
  console.log(
    "[upload/video] headers:",
    req.headers["content-type"]?.substring(0, 100),
    "content-length:",
    req.headers["content-length"]
  );
  uploadVideo.single("file")(req, res, async (err) => {
    try {
      if (!err && req.file) {
        console.log(
          "[upload/video] multer ok, file size:",
          req.file.size
        );
      }
      if (err) {
        console.error("[upload/video] multer error:", err.message, err);
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "El archivo excede el tamaño máximo (100MB)" });
        }
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        console.log("[upload/video] multer sin archivo (req.file ausente)");
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

      console.log("[upload/video] subiendo a CF Stream, size:", req.file.size);

      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      const form = new FormData();
      form.append("file", blob, req.file.originalname || "video.mp4");

      const streamUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;
      const cfRes = await fetch(streamUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${streamToken}`,
        },
        body: form,
      });

      console.log("[upload/video] CF response status:", cfRes.status);

      const cfRawText = await cfRes.text();
      console.log("[upload/video] CF raw response:", cfRawText);
      const data = JSON.parse(cfRawText);
      if (!cfRes.ok || !data.success) {
        const msg =
          data?.errors?.[0]?.message ||
          data?.errors?.[0] ||
          `Error de Cloudflare Stream (${cfRes.status})`;
        return res.status(502).json({ error: String(msg) });
      }

      const result = data.result;
      console.log(
        "[upload/video] CF result uid:",
        result?.uid,
        "duration:",
        result?.duration
      );

      const duration = result?.duration;
      if (duration == null || !Number.isFinite(Number(duration))) {
        return res.status(502).json({
          error: "Respuesta inesperada de Cloudflare Stream (sin duración)",
        });
      }
      const durationNum = Number(duration);
      if (Number.isFinite(durationNum) && durationNum > VIDEO_MAX_DURATION_SEC) {
        return res.status(400).json({
          error: "El video no puede durar más de 30 segundos",
        });
      }

      const video_url = result?.playback?.hls;
      const thumbnail_url = result?.thumbnail;
      const uid = result?.uid;
      if (!video_url || !uid) {
        return res.status(502).json({
          error: "Respuesta inesperada de Cloudflare Stream (sin HLS o UID)",
        });
      }
      const customer = process.env.CF_CUSTOMER_SUBDOMAIN;
      const video_mp4_url = customer
        ? `https://${customer}.cloudflarestream.com/${uid}/downloads/default.mp4`
        : null;
      return res.status(200).json({
        video_url,
        video_mp4_url: video_mp4_url ?? null,
        thumbnail_url: thumbnail_url ?? null,
        duration_s: Math.round(durationNum),
      });
    } catch (e) {
      console.error(
        "[upload/video] error inesperado:",
        e && e.message,
        e && e.stack
      );
      return res.status(500).json({ error: e.message || "Error al procesar el video" });
    }
  });
});

module.exports = router;
