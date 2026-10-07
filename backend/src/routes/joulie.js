const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { COPY, createLimiter, handleJoulie, synthesizeSpeech } = require("../services/joulie");

const router = express.Router();
const chatLimiter = createLimiter();
const voiceLimiter = createLimiter();

function db() {
  return require("../lib/supabase");
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded || "";
  const first = String(raw).split(",")[0].trim();
  return first || req.ip || req.socket?.remoteAddress || "unknown";
}

function sendResult(res, result) {
  if (result.audio) {
    res.setHeader("Content-Type", result.contentType || "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(result.audio);
  }
  if (result.fallback) return res.status(503).json({ fallback: true });
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(200).json({ reply: result.reply });
}

// El cliente solo manda texto. Modelo, prompt, voz y herramientas los fija el servidor.
router.post("/voz", requireAuth, async (req, res) => {
  try {
    const result = await synthesizeSpeech({
      text: typeof req.body?.text === "string" ? req.body.text : "",
      userId: req.authUser?.id,
      ip: clientIp(req),
      supabase: db(),
      limiter: voiceLimiter,
    });
    return sendResult(res, result);
  } catch {
    return res.status(503).json({ fallback: true });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const result = await handleJoulie({
      message: typeof req.body?.message === "string" ? req.body.message : "",
      history: Array.isArray(req.body?.history) ? req.body.history : [],
      userId: req.authUser?.id,
      ip: clientIp(req),
      supabase: db(),
      limiter: chatLimiter,
    });
    return sendResult(res, result);
  } catch {
    return res.status(503).json({ error: COPY.busy });
  }
});

module.exports = router;
