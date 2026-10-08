// La voz: abrir una conversación de ElevenLabs y contestarle como su LLM.
const { prepareJoulie } = require("./chat");
const { COPY, resolveConfig, strEnv } = require("./config");
const { bearerToken, contentChunk, latestUserText, priorHistory, sessionFromRequest } = require("./eleven");
const { FAREWELL_RE, guardReply, stripWebJunk } = require("./guards");
const { isAppAdmin, readEnabled, voiceShouldCharge } = require("./limits");
const { iterateOpenRouter } = require("./openrouter");
const { secretsMatch, sessionSecret, signSession, verifySession } = require("./session");
const { speakText, speakableCut } = require("./speech");

async function mintConversation(opts) {
  const secret = opts.secret || sessionSecret();
  const agentId = opts.agentId || strEnv("JOULIE_ELEVEN_AGENT_ID", "");
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!secret || !agentId || !apiKey) return { status: 503, error: COPY.unavailable };
  if (!(await readEnabled(opts.supabase, opts.enabled))) return { status: 503, error: COPY.unavailable };

  const cfg = opts.limits || resolveConfig();
  const now = opts.now || Date.now();
  const userId = String(opts.userId || "");
  const admin = await isAppAdmin(opts.supabase, userId);
  if (opts.budget && !admin && !opts.budget.canStart(userId, now, cfg.dailyMinutes)) {
    return { status: 429, error: COPY.limited };
  }
  if (
    opts.limiter &&
    !opts.limiter.allow({
      userId,
      ip: `sesion:${userId}`,
      now,
      perMinute: cfg.perMinute,
      dailyCap: cfg.dailyCap,
    })
  ) {
    return { status: 429, error: COPY.limited };
  }

  const session = signSession(userId, secret, now, cfg.sessionTtlMs);
  const call = opts.fetchImpl || fetch;
  let response;
  try {
    response = await call(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey }, signal: AbortSignal.timeout(8000) }
    );
  } catch {
    console.info("[joulie] convai fail");
    return { status: 503, error: COPY.unavailable };
  }
  if (!response.ok) {
    console.info("[joulie] convai %s", response.status);
    return { status: 503, error: COPY.unavailable };
  }
  const json = await response.json().catch(() => ({}));
  if (!json || typeof json.token !== "string" || !json.token) return { status: 503, error: COPY.unavailable };
  if (opts.budget) opts.budget.begin(session, userId, now);
  return { status: 200, token: json.token, session };
}

async function runCustomLlm(opts, write) {
  const secret = opts.secret || sessionSecret();
  const send = typeof write === "function" ? write : () => undefined;
  const speak = (text) => {
    send(contentChunk(speakText(text), null));
    send(contentChunk("", "stop"));
    send("data: [DONE]\n\n");
  };

  if (!secretsMatch(bearerToken(opts.headers), secret)) return { status: 401, error: "No autorizado" };
  // Abre el stream antes de Supabase y OpenRouter: ElevenLabs recibe headers y un chunk al instante.
  send(contentChunk("", null));

  const now = opts.now || Date.now();
  const cfg = opts.limits || resolveConfig();
  const sessionToken = sessionFromRequest(opts.body, opts.headers);
  const session = verifySession(sessionToken, secret, now);
  if (!session) {
    speak("No pude validar la sesión. Entra de nuevo a Joulie.");
    return { status: 200, reply: "No pude validar la sesión. Entra de nuevo a Joulie." };
  }
  const admin = await isAppAdmin(opts.supabase, session.userId);
  if (opts.budget && !admin && !opts.budget.touch(sessionToken, session.userId, now, cfg.dailyMinutes)) {
    speak(COPY.limited);
    return { status: 200, reply: COPY.limited };
  }

  const said = latestUserText(opts.body);
  const charge = !FAREWELL_RE.test(said) && voiceShouldCharge(sessionToken, said, now);
  const prepared = await prepareJoulie({
    message: said,
    history: priorHistory(opts.body),
    userId: `voz:${session.userId}`,
    ownerId: session.userId,
    ip: `llm:${session.userId}`,
    supabase: opts.supabase,
    enabled: opts.enabled,
    limiter: charge ? opts.limiter : null,
    limits: cfg,
    voice: true,
    now,
    loadContext: opts.loadContext,
    webBudget: opts.webBudget,
    webKey: sessionToken,
    webUser: session.userId,
  });
  if (prepared.early) {
    const text = prepared.early.reply || prepared.early.error || COPY.busy;
    speak(text);
    return { status: 200, reply: text };
  }

  let spoken = "";
  let pending = "";
  let startedSend = false;
  try {
    for await (const delta of iterateOpenRouter(
      prepared.messages,
      { ...prepared.cfg, completeStream: opts.completeStream },
      opts.signal
    )) {
      if (!startedSend) {
        startedSend = true;
        console.info("[joulie] %s %dms", prepared.web ? "web-first-token" : "llm-first-token", Date.now() - prepared.started);
      }
      const piece = prepared.web ? stripWebJunk(delta) : delta;
      if (!piece) continue;
      // Revisa lo acumulado: un marcador puede llegar partido entre dos deltas.
      const heard = spoken + piece;
      if ((sessionToken && heard.includes(sessionToken)) || /j9k-canary|sk-or-|sk-ant-|xi-api-key/i.test(heard)) {
        speak(COPY.refusal);
        return { status: 200, reply: COPY.refusal };
      }
      spoken += piece;
      // Las cifras se dicen en palabras, y una cifra a medias espera el siguiente delta.
      pending += piece;
      const cut = speakableCut(pending);
      if (cut) {
        send(contentChunk(speakText(pending.slice(0, cut)), null));
        pending = pending.slice(cut);
      }
    }
  } catch (err) {
    console.info("[joulie] fail %s", err && err.name ? err.name : "error");
    if (!startedSend) {
      speak(COPY.busy);
      return { status: 200, reply: COPY.busy };
    }
  }
  if (pending) send(contentChunk(speakText(pending), null));
  send(contentChunk("", "stop"));
  send("data: [DONE]\n\n");
  return { status: 200, reply: guardReply(spoken) };
}

module.exports = {
  mintConversation,
  runCustomLlm,
};
