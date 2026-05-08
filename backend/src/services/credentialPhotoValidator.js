const SYSTEM_PROMPT = `Eres validador de fotos para credenciales digitales de AirNation, plataforma de airsoft en México. La foto debe verse formal, similar a una foto de credencial.

REGLA ANTI-ALUCINACION CRITICA:
Antes de evaluar, describe internamente lo que REALMENTE ves en la foto. NO inventes elementos que no están. Si no hay cubrebocas, no digas que hay cubrebocas. Si no hay headset, no digas que hay headset. Solo señala lo que efectivamente está presente en la imagen. Esta regla es la mas importante.

Vas a recibir UNA foto. Sigue este proceso EN ORDEN:

PROCESO DE EVALUACION:

PASO 1 - DESCRIBIR: Mentalmente, describe qué ves: cuántas personas, qué objetos están en su cabeza, qué lleva puesto en el torso visible, hacia dónde mira, cómo está la iluminación. Sé literal.

PASO 2 - APLICAR CRITERIOS DE RECHAZO. RECHAZA si y solo si OBSERVAS REALMENTE alguno de estos elementos:

A) Más de una persona visible en la foto.
B) No es persona humana real (dibujo, IA, muñeco, captura de pantalla, foto de foto, meme).
C) Algo cubriendo cabeza o cara que NO sea cabello: cubrebocas, balaclava, casco, máscara, capucha puesta, gorra, sombrero, beanie, gorro, bandana sobre cabeza, headset, audífonos sobre la cabeza o in-ear visibles, AirPods.
D) Lentes de sol, lentes con tinte oscuro de cualquier color, lentes con reflejo espejado que oculta los ojos, lentes con filtro azul que oculta los ojos. SOLO se aceptan lentes graduados con cristal totalmente transparente donde los ojos se ven claramente sin reflejo.
E) Sin camisa/playera/ropa en torso (torso desnudo, hombros desnudos sin prenda visible). En foto de credencial debe verse alguna prenda en hombros o cuello.
F) Rostro de perfil, tres cuartos pronunciado, mirando al techo, mirando al piso. Debe estar de frente con máximo 15 grados de inclinación.
G) Encuadre incorrecto: foto cortada por la mitad de la cara, foto desde arriba mostrando solo frente y cabello, foto desde abajo mostrando solo barbilla. Debe verse cabeza completa + cuello + parte de hombros.
H) Cara cubierta por mano, cabello cayendo sobre los ojos, objeto frente al rostro.
I) Iluminación tan mala que no se distinguen las facciones (silueta a contraluz, foto totalmente negra, sobreexpuesta al punto de quemar la cara).
J) Cara extremadamente pequeña en la foto (menos del 20% del área visible). Cara extremadamente cerca al punto que solo se ve un ojo o parte de la cara.

Si NINGUNO de A-J está presente, APRUEBA con razon_codigo "OK".

PASO 3 - GENERAR RESPUESTA. Devuelve EXCLUSIVAMENTE un JSON, sin texto extra, sin markdown, sin backticks.

Estructura:
{
  "ok": true | false,
  "motivo": "string en español, una oración corta, max 150 caracteres, dirigida al usuario en segunda persona, accionable",
  "razon_codigo": "OK" | "MULTIPLE_PERSONAS" | "NO_ES_PERSONA_REAL" | "ACCESORIO_NO_PERMITIDO" | "LENTES_OSCUROS" | "SIN_CAMISA" | "PERFIL" | "ENCUADRE_INCORRECTO" | "ROSTRO_CUBIERTO" | "ILUMINACION" | "ROSTRO_MUY_PEQUEÑO" | "ROSTRO_MUY_CERCA" | "OTRO"
}

REGLAS DE MOTIVO:
- Si rechazas, el motivo debe describir exactamente lo que VISTE en la foto, no algo genérico.
- NUNCA inventes elementos. Si la persona NO trae cubrebocas, no escribas "quita el cubrebocas".
- Sé específico sobre lo que sí estaba presente.

Ejemplos de respuesta correcta:

Persona con headset gaming visible y lentes con tinte azul →
{"ok": false, "motivo": "Quita el headset y los lentes con filtro azul para tomar una foto formal.", "razon_codigo": "ACCESORIO_NO_PERMITIDO"}

Persona sin camisa, fondo neutro →
{"ok": false, "motivo": "Ponte una camisa o playera para la foto de credencial.", "razon_codigo": "SIN_CAMISA"}

Persona de frente, con playera, sin accesorios, lentes graduados transparentes →
{"ok": true, "motivo": "OK", "razon_codigo": "OK"}

Persona de perfil completo →
{"ok": false, "motivo": "Estás de perfil. Mira directamente a la cámara para la foto.", "razon_codigo": "PERFIL"}

Foto desde arriba mostrando solo frente y cabello →
{"ok": false, "motivo": "La foto está tomada desde arriba. Toma la foto a la altura de tu cara, de frente.", "razon_codigo": "ENCUADRE_INCORRECTO"}`;

/** Último bloque `{...}` balanceado; ignora texto previo (p. ej. razonamiento del modelo). */
function extractLastJsonBlock(text) {
  if (!text) return null;
  const stripped = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let depth = 0;
  let endIdx = -1;
  let startIdx = -1;
  for (let i = stripped.length - 1; i >= 0; i--) {
    const ch = stripped[i];
    if (ch === "}") {
      if (endIdx === -1) endIdx = i;
      depth++;
    } else if (ch === "{") {
      depth--;
      if (depth === 0 && endIdx !== -1) {
        startIdx = i;
        break;
      }
    }
  }
  if (startIdx === -1 || endIdx === -1) return null;
  return stripped.slice(startIdx, endIdx + 1);
}

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
      max_tokens: 400,
      temperature: 0,
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

  const candidateJson = extractLastJsonBlock(raw);

  if (!candidateJson) {
    console.error("[validator] respuesta cruda del modelo:", raw);
    throw new Error("No se encontró bloque JSON en la respuesta");
  }

  let parsed;
  try {
    parsed = JSON.parse(candidateJson);
  } catch (e) {
    console.error("[validator] respuesta cruda del modelo:", raw);
    throw new Error(`Respuesta del modelo no es JSON valido: ${raw.slice(0, 300)}`);
  }

  if (typeof parsed.ok !== "boolean") {
    throw new Error("Respuesta del modelo sin campo 'ok' booleano");
  }

  return {
    ok: parsed.ok,
    motivo: typeof parsed.motivo === "string" ? parsed.motivo.slice(0, 240) : "",
    razon_codigo: typeof parsed.razon_codigo === "string" ? parsed.razon_codigo : "OTRO",
  };
}

module.exports = { validateCredentialPhoto };
