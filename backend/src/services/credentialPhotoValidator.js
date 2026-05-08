const SYSTEM_PROMPT = `Eres validador de fotos para credenciales oficiales de AirNation, plataforma de airsoft en Mexico. Vas a recibir UNA foto que un usuario quiere usar como su foto institucional de credencial.

Evalua la foto contra estos criterios y responde EXCLUSIVAMENTE en JSON, sin texto adicional, sin markdown, sin backticks.

CRITERIOS DE APROBACION (todos deben cumplirse):
1. Hay exactamente UNA persona visible (rostro humano real, no dibujo, no muneco, no IA generada obvia).
2. El rostro esta de frente o ligeramente angulado, no de perfil completo.
3. Los dos ojos son visibles. NO acepta lentes oscuros ni gafas opacas.
4. La boca y nariz son visibles. NO acepta cubrebocas, balaclava, panuelo cubriendo, casco con visor cerrado.
5. La cara ocupa al menos ~25% del area de la foto.
6. La iluminacion permite ver claramente las facciones.
7. La foto no es manifiestamente captura de pantalla, foto de otra foto, o meme.

CRITERIOS QUE SI SE PERMITEN:
- Lentes graduados transparentes.
- Gorras, gorros tacticos, bandanas en la frente (sin cubrir ojos/boca).
- Pintura facial tactica ligera.
- Fondo cualquiera.
- Cualquier expresion.

Responde SOLO con este JSON:

{
  "ok": true|false,
  "motivo": "string corto en espanol, maximo 80 caracteres, dirigido al usuario en segunda persona",
  "razon_codigo": "OK" | "MULTIPLE_PERSONAS" | "SIN_ROSTRO" | "ROSTRO_CUBIERTO" | "LENTES_OSCUROS" | "PERFIL" | "ROSTRO_MUY_PEQUENO" | "ILUMINACION" | "NO_ES_PERSONA_REAL" | "OTRO"
}`;

async function validateCredentialPhoto(base64Image, mimeType = "image/jpeg") {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Falta OPENROUTER_API_KEY");
  }

  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://airnation.online",
      "X-Title": "AirNation Credential Validator",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text",
              text: "Evalua esta foto.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  const json = await response.json();
  const raw = json?.choices?.[0]?.message?.content?.trim() || "";

  // Limpiar posibles backticks o markdown si el modelo se rebela
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Respuesta del modelo no es JSON valido: ${cleaned}`);
  }

  if (typeof parsed.ok !== "boolean") {
    throw new Error("Respuesta del modelo sin campo 'ok' booleano");
  }

  return {
    ok: parsed.ok,
    motivo: typeof parsed.motivo === "string" ? parsed.motivo.slice(0, 120) : "",
    razon_codigo: typeof parsed.razon_codigo === "string" ? parsed.razon_codigo : "OTRO",
  };
}

module.exports = { validateCredentialPhoto };
