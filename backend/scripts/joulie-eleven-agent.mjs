/**
 * Crea o actualiza el agente privado JOULIE en ElevenLabs.
 * Uso, con las variables de Railway en el entorno:
 *   node backend/scripts/joulie-eleven-agent.mjs
 *
 * Requiere ELEVENLABS_API_KEY con convai_read y convai_write,
 * y JOULIE_ELEVEN_LLM_SECRET (el mismo valor que en Railway).
 */
const API = "https://api.elevenlabs.io/v1";
const NAME = "JOULIE";
const SECRET_NAME = "JOULIE_LLM";
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "kcQkGnn0HAT2JRDQ4Ljp";
const GREETING = "Hola, soy JOULIE. ¿En qué te ayudo?";
// URL base: ElevenLabs le agrega /chat/completions al llamar.
const LLM_URL =
  process.env.JOULIE_LLM_PUBLIC_URL || "https://air-nation-production.up.railway.app/api/v1/joulie/llm";

const key = process.env.ELEVENLABS_API_KEY || "";
const secret = process.env.JOULIE_ELEVEN_LLM_SECRET || "";

function redact(text) {
  return String(text || "").split(secret).join("[secret]").slice(0, 800);
}

async function api(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    const error = new Error(`${method} ${path} -> ${response.status}`);
    error.detail = redact(text);
    throw error;
  }
  return json;
}

function agentBody(secretId, withHeader) {
  const customLlm = {
    url: LLM_URL,
    model_id: process.env.JOULIE_MODEL || "google/gemini-2.5-flash",
    api_type: "chat_completions",
    api_key: { secret_id: secretId },
  };
  if (withHeader) {
    customLlm.request_headers = {
      "x-joulie-session": { variable_name: "joulie_session" },
    };
  }
  return {
    name: NAME,
    conversation_config: {
      agent: {
        first_message: GREETING,
        language: "es",
        disable_first_message_interruptions: false,
        max_conversation_duration_message: "Listo. Aquí te dejo.",
        prompt: {
          prompt:
            "Eres JOULIE. El servidor de AirNation reemplaza este texto. Marca j9s:{{joulie_session}}.",
          llm: "custom-llm",
          temperature: 0.3,
          max_tokens: 70,
          custom_llm: customLlm,
          // Sin LLM de respaldo: respondería sin los datos ni las reglas del servidor.
          backup_llm_config: { preference: "disabled" },
          cascade_timeout_seconds: 8,
        },
      },
      tts: {
        voice_id: VOICE_ID,
        model_id: "eleven_flash_v2_5",
        optimize_streaming_latency: 4,
      },
      // normal: eager tomaba el ruido del evento como turno y la pasaba a escuchando.
      // El cliente avisa actividad solo tras ~300 ms de voz, así una interrupción real sigue rápida.
      // Hay que volver a correr este script.
      turn: {
        turn_eagerness: "normal",
        turn_timeout: 5,
        speculative_turn: true,
        silence_end_call_timeout: 20,
      },
      conversation: {
        max_duration_seconds: 180,
      },
    },
    platform_settings: {
      auth: {
        enable_auth: true,
        allowlist: [{ hostname: "www.airnation.online" }, { hostname: "airnation.online" }],
      },
      overrides: {
        conversation_config_override: {
          agent: { first_message: true, language: true, prompt: { prompt: false } },
          tts: { voice_id: false },
        },
      },
    },
  };
}

async function upsert(secretId) {
  const listed = await api("GET", "/convai/agents?page_size=100");
  const agents = Array.isArray(listed?.agents) ? listed.agents : [];
  const existing = agents.find((agent) => agent?.name === NAME);
  try {
    if (existing?.agent_id) {
      await api("PATCH", `/convai/agents/${existing.agent_id}`, agentBody(secretId, true));
      return existing.agent_id;
    }
    const created = await api("POST", "/convai/agents/create", agentBody(secretId, true));
    return created.agent_id;
  } catch (error) {
    console.warn("[joulie] reintento sin header de sesión:", error.detail || error.message);
    if (existing?.agent_id) {
      await api("PATCH", `/convai/agents/${existing.agent_id}`, agentBody(secretId, false));
      return existing.agent_id;
    }
    const created = await api("POST", "/convai/agents/create", agentBody(secretId, false));
    return created.agent_id;
  }
}

async function ensureSecret() {
  const listed = await api("GET", "/convai/secrets");
  const secrets = Array.isArray(listed?.secrets) ? listed.secrets : [];
  const found = secrets.find((item) => item?.name === SECRET_NAME);
  if (found?.secret_id) {
    console.log(
      `[joulie] reutilizo el secreto ${SECRET_NAME}. Si rotaste JOULIE_ELEVEN_LLM_SECRET, bórralo en ElevenLabs y vuelve a correr este script.`
    );
    return found.secret_id;
  }
  const created = await api("POST", "/convai/secrets", { type: "new", name: SECRET_NAME, value: secret });
  if (!created?.secret_id) throw new Error("ElevenLabs no devolvió secret_id");
  return created.secret_id;
}

if (!key || !secret) {
  console.error("Faltan ELEVENLABS_API_KEY y JOULIE_ELEVEN_LLM_SECRET en el entorno.");
  process.exit(1);
}

try {
  const secretId = await ensureSecret();
  const agentId = await upsert(secretId);
  console.log(`JOULIE_ELEVEN_AGENT_ID=${agentId}`);
  console.log("Pon ese id en Railway y vuelve a desplegar el backend.");
} catch (error) {
  console.error(error.message);
  if (error.detail) console.error(error.detail);
  process.exit(1);
}
