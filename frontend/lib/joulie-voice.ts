export type VoiceLike = { lang: string; name: string; voiceURI?: string }

const FEMALE =
  /\b(female|mujer|femenin|paulina|ang[eé]lica|m[oó]nica|sabina|helena|luc[ií]a|sof[ií]a|elena|dalia|paloma|camila|renata|ximena|valeria|laura|carmen|mar[ií]a)\b/i

function langOf(voice: VoiceLike) {
  return (voice.lang || '').toLowerCase().replace('_', '-')
}

function isFemale(voice: VoiceLike) {
  return FEMALE.test(`${voice.name} ${voice.voiceURI || ''}`)
}

/** es-MX femenina, luego es-US femenina, luego cualquier es femenina, luego español del dispositivo. */
export function pickJoulieVoice<T extends VoiceLike>(voices: T[]): T | null {
  let best: T | null = null
  let bestScore = 0
  for (const voice of voices) {
    const lang = langOf(voice)
    const spanish = lang.startsWith('es-mx') ? 3 : lang.startsWith('es-us') ? 2 : lang.startsWith('es') ? 1 : 0
    if (!spanish) continue
    const female = isFemale(voice)
    const score = female ? 10 + spanish : spanish
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }
  return best
}
