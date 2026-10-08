// Un turno de JOULIE de principio a fin: cortes, cupo, DATOS, prompt y respuesta.
const { COPY, DEFAULTS, resolveConfig } = require("./config");
const { isEmptyContext, shapeContext, stampContext } = require("./context");
const { pipeSentence } = require("./eleven");
const {
  CAPABILITY_RE,
  FAREWELL_RE,
  GREETING_RE,
  IDENTITY_RE,
  INJECTION_RE,
  SELF_RE,
  guardReply,
  sanitizeHistory,
  stripWebJunk,
} = require("./guards");
const { lookupText, mentionsFields, wantsAdvice, wantsTeams } = require("./intent");
const { readEnabled } = require("./limits");
const { completeOpenRouter, iterateOpenRouter } = require("./openrouter");
const { systemPrompt } = require("./prompt");
const { loadOwnArsenal, loadPublicContext } = require("./queries");
const { reasoningPlan } = require("./reasoning");
const { speakText } = require("./speech");
const { closeStream, takeSentence } = require("./text");
const { wantsWebFallback, wantsWebOptions } = require("./web-search");

function logOutcome(outcome, started, reason) {
  console.info("[joulie] %s %dms razona:%s", outcome, Date.now() - started, reason ? "si" : "no");
}

async function prepareJoulie(opts) {
  const cfg = opts.limits || resolveConfig();
  const started = Date.now();
  const finish = (status, body, outcome) => {
    logOutcome(outcome, started);
    return { early: { status, ...body }, started };
  };

  if (!(await readEnabled(opts.supabase, opts.enabled))) {
    return finish(503, { error: COPY.unavailable }, "off");
  }

  const text = typeof opts.message === "string" ? opts.message.trim() : "";
  if (!text) return finish(400, { error: COPY.empty }, "empty");
  if (text.length > cfg.maxInput) return finish(400, { error: COPY.tooLong }, "long");
  if (INJECTION_RE.test(text)) return finish(200, { reply: COPY.refusal }, "refuse");
  // Lo que no es airsoft no se corta con una frase hecha: lo desvía ella, con
  // calidez y con sus palabras (prompt.js). La frase fija queda para la inyección.
  if (GREETING_RE.test(text)) return finish(200, { reply: COPY.hello }, "ok");
  if (IDENTITY_RE.test(text)) return finish(200, { reply: COPY.who }, "ok");
  if (CAPABILITY_RE.test(text)) return finish(200, { reply: COPY.can }, "ok");
  if (FAREWELL_RE.test(text)) return finish(200, { reply: COPY.bye }, "ok");

  const limiter = opts.limiter;
  const perMinute = opts.voice ? cfg.voicePerMinute || DEFAULTS.voicePerMinute : cfg.perMinute;
  const dailyCap = opts.voice ? cfg.voiceDailyCap || DEFAULTS.voiceDailyCap : cfg.dailyCap;
  if (
    limiter &&
    !limiter.allow({
      userId: String(opts.userId || ""),
      ip: String(opts.ip || ""),
      now: opts.now || Date.now(),
      perMinute,
      dailyCap,
    })
  ) {
    return finish(429, { error: COPY.limited }, "limit");
  }

  const history = sanitizeHistory(opts.history, cfg.historyTurns, cfg.maxInput);
  // Si la pregunta nombra campos o equipos, busca solo con ella: el historial
  // traería la ciudad de la pregunta anterior.
  const lookup = mentionsFields(text) || wantsTeams(text) ? text : lookupText(text, history);
  let raw;
  try {
    raw = opts.loadContext
      ? await opts.loadContext(lookup)
      : await loadPublicContext(opts.supabase, lookup);
    const own = opts.ownerId && opts.supabase ? await loadOwnArsenal(opts.supabase, opts.ownerId) : [];
    if (own.length) raw = { ...(raw && typeof raw === "object" ? raw : {}), tu_arsenal: own };
  } catch {
    return finish(503, { error: COPY.busy }, "fail");
  }

  const datos = stampContext(shapeContext(raw), opts.now || Date.now());
  const limits = { ...(opts.limits || cfg) };
  const webBudget = opts.webBudget;
  const sessionKey = opts.webKey || String(opts.webUser || opts.userId || "anon");
  const webUser = String(opts.webUser || opts.userId || sessionKey);
  // Lo que no se contesta con DATOS (consejo de airsoft, o algo sobre ella misma)
  // no se corta por falta de DATOS.
  const hollow = isEmptyContext(datos) && !SELF_RE.test(text);
  const web =
    (wantsWebOptions(text) || (hollow && wantsWebFallback(text))) &&
    (!webBudget ||
      webBudget.allow(sessionKey, webUser, opts.now || Date.now(), limits.webSession, limits.webDaily));
  // Sin DATOS, sin búsqueda y sin ser consejo no hay nada que decir. Si lo
  // anterior ya fue un «no tengo ese dato», se pregunta en vez de repetirlo.
  if (hollow && !web && !wantsAdvice(text)) {
    const last = [...history].reverse().find((turn) => turn.role === "assistant");
    const repeated = last && (last.content === COPY.noData || last.content === COPY.clarify);
    return finish(200, { reply: repeated ? COPY.clarify : COPY.noData }, "ok");
  }
  // Pensar antes de hablar solo cuando el turno lo pide: lo decide reasoning.js
  // con las señales que ya se calcularon aquí.
  const think = reasoningPlan(
    { web, advice: wantsAdvice(text), hollow, foco: raw && raw.foco,  text },
    limits
  );
  const used = { ...limits, web, reason: think.tokens };

  const messages = [
    { role: "system", content: systemPrompt(datos, web) },
    ...history,
    { role: "user", content: text.slice(0, cfg.maxInput) },
  ];

  return { cfg: used, web, reasoning: think.on, started, messages };
}

async function handleJoulie(opts) {
  const prepared = await prepareJoulie(opts);
  if (prepared.early) return prepared.early;
  try {
    const run = opts.complete || ((msgs) => completeOpenRouter(msgs, prepared.cfg));
    const reply = guardReply(await run(prepared.messages));
    logOutcome("ok", prepared.started, prepared.reasoning);
    return { status: 200, reply };
  } catch (err) {
    console.info("[joulie] fail %s", err && err.name ? err.name : "error");
    logOutcome("fail", prepared.started, prepared.reasoning);
    return { status: 503, error: COPY.busy };
  }
}

async function streamJoulie(opts, emit, signal) {
  const prepared = await prepareJoulie(opts);
  const send = typeof emit === "function" ? emit : () => undefined;
  if (prepared.early) {
    if (prepared.early.reply) send("reply", { reply: prepared.early.reply });
    else send("error", { error: prepared.early.error || COPY.busy });
    send("done", { firstAudioMs: null });
    return prepared.early;
  }

  send("phase", { phase: "thinking" });
  let full = "";
  let pending = "";
  let firstAudioMs = null;
  let sawModel = false;
  let flushed = false;
  const stop = {};
  let chain = Promise.resolve();
  const noteAudio = () => {
    if (firstAudioMs == null) {
      firstAudioMs = Date.now() - prepared.started;
      console.info("[joulie] first-audio %dms", firstAudioMs);
    }
  };
  const enqueue = (sentence) => {
    // A la voz le va la frase con las cifras en palabras; el texto de la
    // respuesta sigue saliendo con sus números.
    const spoken = speakText(guardReply(sentence));
    if (!spoken) return;
    chain = chain.then(async () => {
      if (signal?.aborted) return;
      const ok = await pipeSentence(
        spoken,
        (chunk) => {
          noteAudio();
          send("audio", { format: "pcm_22050", b64: chunk.toString("base64") });
        },
        signal,
        opts.speakSentence
      );
      if (!ok) send("fallback", { text: spoken });
    });
  };

  try {
    for await (const delta of iterateOpenRouter(prepared.messages, { ...prepared.cfg, completeStream: opts.completeStream }, signal, stop)) {
      if (signal?.aborted) break;
      if (prepared.web && !sawModel) {
        sawModel = true;
        console.info("[joulie] web %dms", Date.now() - prepared.started);
      }
      const piece = prepared.web ? stripWebJunk(delta) : delta;
      if (!piece) continue;
      full += piece;
      pending += piece;
      send("delta", { text: full });
      let next = takeSentence(pending);
      while (next) {
        pending = next.rest;
        flushed = true;
        enqueue(next.sentence);
        next = takeSentence(pending);
      }
    }
  } catch (err) {
    console.info("[joulie] fail %s", err && err.name ? err.name : "error");
    if (!full.trim()) {
      logOutcome("fail", prepared.started, prepared.reasoning);
      send("error", { error: COPY.busy });
      send("done", { firstAudioMs });
      return { status: 503, error: COPY.busy, firstAudioMs };
    }
  }

  // Si el modelo se cortó por el tope, la frase incompleta no se dice.
  const tail = closeStream(pending, stop.reason && stop.reason !== "stop", flushed);
  if (tail.trim()) enqueue(tail);
  await chain;
  const reply = guardReply(full.trim() || COPY.noData);
  send("reply", { reply, firstAudioMs });
  send("done", { firstAudioMs });
  logOutcome(firstAudioMs == null ? "ok" : "audio", prepared.started, prepared.reasoning);
  return { status: 200, reply, firstAudioMs };
}

module.exports = {
  handleJoulie,
  prepareJoulie,
  streamJoulie,
};
