const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  COPY,
  createLimiter,
  createVoiceBudget,
  createWebBudget,
  handleJoulie,
  mintConversation,
  runCustomLlm,
  synthesizeSpeech,
} = require("../services/joulie");

const router = express.Router();
const chatLimiter = createLimiter();
const voiceLimiter = createLimiter();
const sessionLimiter = createLimiter();
const voiceBudget = createVoiceBudget();
const webBudget = createWebBudget();

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

router.post("/sesion", requireAuth, async (req, res) => {
  try {
    const result = await mintConversation({
      userId: req.authUser?.id,
      supabase: db(),
      limiter: sessionLimiter,
      budget: voiceBudget,
    });
    if (result.error) return res.status(result.status).json({ error: result.error });
    return res.status(200).json({ token: result.token, session: result.session });
  } catch {
    return res.status(503).json({ error: COPY.unavailable });
  }
});

// Lo llama ElevenLabs, no el navegador. El secreto va en Authorization y la
// sesión firmada identifica al usuario de AirNation.
router.post("/llm/chat/completions", async (req, res) => {
  let opened = false;
  const open = () => {
    if (opened) return;
    opened = true;
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();
  };
  try {
    const result = await runCustomLlm(
      {
        headers: req.headers,
        body: req.body,
        supabase: db(),
        limiter: chatLimiter,
        budget: voiceBudget,
        webBudget,
      },
      (frame) => {
        open();
        if (!res.writableEnded) res.write(frame);
      }
    );
    if (!opened) return res.status(result.status || 401).json({ error: result.error || "No autorizado" });
    if (!res.writableEnded) res.end();
  } catch {
    if (!opened) return res.status(503).json({ error: COPY.busy });
    if (!res.writableEnded) res.end();
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
      webBudget,
      webKey: `texto:${req.authUser?.id || clientIp(req)}`,
      webUser: req.authUser?.id,
    });
    return sendResult(res, result);
  } catch {
    return res.status(503).json({ error: COPY.busy });
  }
});

module.exports = router;
