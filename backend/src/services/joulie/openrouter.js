// La llamada a OpenRouter: cuerpo, reintentos y el stream de deltas.

function buildChatBody(messages, cfg, stream) {
  // cfg.reason son los tokens que este turno puede pensar (0 = no piensa, y así
  // se manda explícito). OpenRouter cuenta razonamiento y respuesta contra el
  // mismo max_tokens, así que el presupuesto hablado se suma aparte: pensar no
  // se come las frases. exclude deja el razonamiento fuera de la respuesta.
  const think = Math.max(0, Math.floor(Number(cfg.reason) || 0));
  const body = {
    model: cfg.model,
    max_tokens: cfg.maxTokens + think,
    temperature: 0.3,
    stream: Boolean(stream),
    reasoning: { max_tokens: think, exclude: true },
    provider: { sort: "latency" },
    messages,
  };
  if (!cfg.web) return body;
  // Gemini 2.5 Flash no busca en la web. El plugin de OpenRouter sí, una vez,
  // con Exa y la misma llave. La herramienta openrouter:web_search puede no
  // buscar. 3 resultados.
  body.plugins = [
    {
      id: "web",
      engine: "exa",
      max_results: 3,
      // Quien pregunta compra en México: resultados en español y precios en
      // pesos. El plugin pega esta nota antes de los resultados.
      search_prompt:
        "Resultados de una búsqueda web. Prioriza fuentes de México y en español, y precios en pesos mexicanos (MXN); si un precio viene en otra moneda, di cuál es. Usa solo lo que responda la pregunta; si nada la responde, dilo.",
    },
  ];
  return body;
}

function openRouterHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://airnation.online",
    "X-Title": "AirNation JOULIE",
  };
}

async function postOpenRouter(body, cfg, signal) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const err = new Error("no-key");
    err.code = "NO_KEY";
    throw err;
  }
  const send = (payload) =>
    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: openRouterHeaders(apiKey),
      signal: signal || AbortSignal.timeout(cfg.timeoutMs),
      body: JSON.stringify(payload),
    });
  let current = body;
  let response = await send(current);
  if (response.status === 400 && current.plugins) {
    console.info("[joulie] web plugin 400; reintento con herramienta");
    const next = { ...current };
    delete next.plugins;
    next.tools = [
      {
        type: "openrouter:web_search",
        parameters: {
          engine: "exa",
          mode: "fast",
          max_results: 3,
          max_total_results: 3,
          max_uses: 1,
          max_characters: 500,
        },
      },
    ];
    next.max_tool_calls = 1;
    current = next;
    response = await send(current);
  }
  if (response.ok || response.status !== 400 || !current.reasoning) return response;
  console.info("[joulie] provider 400; reintento sin razonamiento");
  const plain = { ...current };
  delete plain.reasoning;
  delete plain.provider;
  return send(plain);
}

async function completeOpenRouter(messages, cfg) {
  const response = await postOpenRouter(buildChatBody(messages, cfg, false), cfg);
  if (!response.ok) {
    console.info("[joulie] provider %s", response.status);
    throw new Error("provider");
  }
  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

// stop, si viene, es dónde se apunta el finish_reason del stream: "length" es
// que el modelo se quedó a media frase por el tope de tokens. Nunca sale como
// texto ni como voz.
async function* iterateOpenRouter(messages, cfg, signal, stop) {
  const flag = stop && typeof stop === "object" ? stop : {};
  if (typeof cfg.completeStream === "function") {
    yield* cfg.completeStream(messages, flag);
    return;
  }
  const response = await postOpenRouter(buildChatBody(messages, cfg, true), cfg, signal);
  if (!response.ok || !response.body) {
    console.info("[joulie] provider %s", response.status);
    throw new Error("provider");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        // Solo el contenido: delta.reasoning y delta.reasoning_details nunca
        // salen de aquí, ni al texto ni a la voz.
        const reason = json?.choices?.[0]?.finish_reason;
        if (typeof reason === "string" && reason) flag.reason = reason;
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) yield delta;
      } catch {
        /* fragmento incompleto */
      }
    }
  }
}

module.exports = {
  buildChatBody,
  completeOpenRouter,
  iterateOpenRouter,
};
