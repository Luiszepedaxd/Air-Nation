const express = require("express");
const multer = require("multer");
const { uploadToCloudflare } = require("../services/cloudflare");
const { requireAuth } = require("../middleware/requireAuth");

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);

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

module.exports = router;
