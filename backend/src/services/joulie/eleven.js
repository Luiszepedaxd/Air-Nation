// El protocolo con ElevenLabs: su voz, leer el request del custom LLM y escribirle chunks.
// Voz Norah. Cambiar el id aquí o con ELEVENLABS_VOICE_ID (opcional).
const { strEnv } = require("./config");

const DEFAULT_ELEVENLABS_VOICE_ID = "kcQkGnn0HAT2JRDQ4Ljp";

const ELEVENLABS_MODELS = ["eleven_flash_v2_5", "eleven_turbo_v2_5"];

function voiceId() {
  return strEnv("ELEVENLABS_VOICE_ID", DEFAULT_ELEVENLABS_VOICE_ID);
}

function headerValue(headers, name) {
  if (!headers) return "";
  const found = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
  if (!found) return "";
  const value = headers[found];
  return (Array.isArray(value) ? value[0] : value || "").toString().trim();
}

function bearerToken(headers) {
  const raw = headerValue(headers, "authorization");
  return raw.toLowerCase().startsWith("bearer ") ? raw.slice(7).trim() : "";
}

function sessionFromRequest(body, headers) {
  const direct = headerValue(headers, "x-joulie-session");
  if (direct) return direct;
  const bags = [
    body?.elevenlabs_extra_body?.dynamic_variables,
    body?.custom_llm_extra_body?.dynamic_variables,
    body?.dynamic_variables,
    body?.conversation_initiation_client_data?.dynamic_variables,
  ];
  for (const bag of bags) {
    if (bag && typeof bag.joulie_session === "string" && bag.joulie_session.trim()) return bag.joulie_session.trim();
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  for (const message of messages) {
    if (!message || message.role !== "system" || typeof message.content !== "string") continue;
    const match = message.content.match(/j9s:([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
    if (match) return match[1];
  }
  return "";
}

function messageText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => (typeof part === "string" ? part : part && typeof part.text === "string" ? part.text : ""))
    .join(" ")
    .trim();
}

function latestUserText(body) {
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role !== "user") continue;
    const text = messageText(messages[i].content);
    if (text) return text;
  }
  return "";
}

function priorHistory(body) {
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const usable = [];
  for (const message of messages) {
    if (!message || (message.role !== "user" && message.role !== "assistant")) continue;
    const content = messageText(message.content);
    if (content) usable.push({ role: message.role, content });
  }
  if (usable.length && usable[usable.length - 1].role === "user") usable.pop();
  return usable;
}

function contentChunk(text, finish) {
  return `data: ${JSON.stringify({
    id: "chatcmpl-joulie",
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "joulie",
    choices: [{ index: 0, delta: text ? { content: text } : {}, finish_reason: finish || null }],
  })}\n\n`;
}

async function pipeSentence(text, onChunk, signal, speakImpl) {
  if (typeof speakImpl === "function") return speakImpl(text, onChunk);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return false;
  const id = voiceId();
  let leftover = Buffer.alloc(0);
  for (const model of ELEVENLABS_MODELS) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}/stream?optimize_streaming_latency=4&output_format=pcm_22050`;
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.slice(0, 280),
          model_id: model,
          language_code: "es",
          voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0, use_speaker_boost: false },
        }),
        signal,
      });
    } catch {
      return false;
    }
    if (!response.ok || !response.body) {
      warnVoiceStatus(response.status);
      if (response.status === 400 || response.status === 422) continue;
      return false;
    }
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) {
        reader.cancel().catch(() => undefined);
        return true;
      }
      const merged = leftover.length ? Buffer.concat([leftover, Buffer.from(value)]) : Buffer.from(value);
      const even = merged.length - (merged.length % 2);
      leftover = merged.subarray(even);
      if (even) onChunk(merged.subarray(0, even));
    }
    return true;
  }
  return false;
}

function warnVoiceStatus(status) {
  if (status === 401 || status === 403 || status === 402) {
    console.warn("[joulie] ElevenLabs %s; voz del dispositivo", status);
  } else {
    console.info("[joulie] tts %s", status);
  }
}

module.exports = {
  DEFAULT_ELEVENLABS_VOICE_ID,
  bearerToken,
  contentChunk,
  headerValue,
  latestUserText,
  pipeSentence,
  priorHistory,
  sessionFromRequest,
  voiceId,
};
