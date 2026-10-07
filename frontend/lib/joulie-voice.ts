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

export type Talk = { floor: number; loudAt: number; quietAt: number; talking: boolean }

export const TALK_START: Talk = { floor: 1, loudAt: -Infinity, quietAt: -Infinity, talking: false }

/**
 * ¿Habla el operador? Nivel del micrófono (0–1) sobre su propio ruido de fondo,
 * con 300 ms de gracia para no parpadear entre sílabas. El piso baja al instante
 * y sube despacio, así sigue al ruido y no a la voz.
 * Mientras JOULIE habla hace falta más margen y ~300 ms seguidos: un pico del
 * local o de su propia voz no cuenta. Al soltar, 200 ms de histéresis.
 * ponytail: la subida va por cuadro (~60 fps). Si el anillo queda pegado, sube BARGE_MARGIN.
 */
export const TALK_MARGIN = 0.05
export const BARGE_MARGIN = 0.12
export const BARGE_RELEASE = 0.06
export const BARGE_MS = 300
export const RELEASE_MS = 200

export function trackTalk(prev: Talk, level: number, now: number, speaking = false): Talk {
  const floor = level < prev.floor ? level : prev.floor + (level - prev.floor) * 0.002
  if (!speaking) {
    const loudAt = level > floor + TALK_MARGIN ? now : prev.loudAt
    return { floor, loudAt, quietAt: prev.quietAt, talking: now - loudAt < 300 }
  }
  const hot = level > floor + (prev.talking ? BARGE_RELEASE : BARGE_MARGIN)
  if (hot) {
    const loudAt = prev.quietAt < 0 && prev.loudAt > 0 ? prev.loudAt : now
    return { floor, loudAt, quietAt: -Infinity, talking: prev.talking || now - loudAt >= BARGE_MS }
  }
  if (!prev.talking) return { floor, loudAt: -Infinity, quietAt: now, talking: false }
  const quietAt = prev.quietAt > 0 ? prev.quietAt : now
  return { floor, loudAt: prev.loudAt, quietAt, talking: now - quietAt < RELEASE_MS }
}

/** El VAD llega en eventos sueltos. 400 ms tapa el hueco sin dejar el anillo pegado. */
export const VAD_HOLD_MS = 400

export function hearingNow(micTalking: boolean, vadAt: number, now: number, muted: boolean, speaking = false): boolean {
  if (muted) return false
  if (speaking) return micTalking
  return micTalking || (vadAt > 0 && now - vadAt < VAD_HOLD_MS)
}

export type OrbPhase = 'idle' | 'starting' | 'listening' | 'hearing' | 'thinking' | 'speaking'

/** Iniciando al conectar. Pensando solo entre el turno del operador y el audio de JOULIE. */
export function orbPhase(input: {
  status: string
  agentMode: string
  waiting: boolean
  userTalking: boolean
  sheAudible: boolean
}): OrbPhase {
  if (input.status === 'connecting') return 'starting'
  if (input.status !== 'connected') return 'idle'
  if (input.userTalking && (input.agentMode === 'speaking' || input.sheAudible)) return 'hearing'
  if (input.agentMode === 'speaking' || input.sheAudible) return 'speaking'
  if (input.waiting) return 'thinking'
  if (input.userTalking) return 'hearing'
  return 'listening'
}

/** El SDK ya pide estas tres. Se fuerzan por si una versión las apaga. */
export function micAudio(audio: boolean | MediaTrackConstraints | undefined): MediaTrackConstraints {
  const base = audio && typeof audio === 'object' ? { ...audio } : {}
  return { ...base, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
}

export function easeLevel(prev: number, target: number): number {
  if (!Number.isFinite(prev)) return target
  const next = prev + (target - prev) * 0.35
  return Math.abs(next - target) < 0.01 ? target : next
}

/** ElevenLabs cobra el tiempo de la llamada. 180 s es el tope, también para un admin. */
export const CALL_LIMIT_MS = 180_000
/** La despedida cabe en los últimos 8 s. Un evento ruidoso no acorta esto. */
export const CALL_BYE_MS = 172_000

const HANGUP_LINES = [
  "Llegaste al límite de preguntas por ahora. Intenta más tarde.",
  "Listo. Aquí te dejo.",
]

export function shouldHangUp(text: string): boolean {
  const line = text.trim()
  return HANGUP_LINES.some((item) => line === item || line.startsWith(item))
}

export function callClock(elapsedMs: number): "open" | "bye" | "end" {
  if (elapsedMs >= CALL_LIMIT_MS) return "end"
  if (elapsedMs >= CALL_BYE_MS) return "bye"
  return "open"
}

/** Mientras ella habla, la voz del operador gana ya: no espera a que ElevenLabs cambie de modo. */
export function voiceFace<T extends string>(phase: T, hearing: boolean): T | 'hearing' {
  return hearing && (phase === 'listening' || phase === 'speaking') ? 'hearing' : phase
}

const OUTPUT_NOISE = 0.02

/**
 * Nivel visible del orbe (0–1). El volumen de salida de ElevenLabs suele
 * quedarse bajo 0.3; la raíz lo sube. Si llegan bins, cuenta la banda de voz
 * (el tercio grave: en WebRTC a 48 kHz eso es ~100–8000 Hz). Bajo 0.02, quieto.
 */
export function outputLevel(volume: number, bins?: ArrayLike<number> | null): number {
  const vol = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0
  let energy = 0
  const count = bins?.length ?? 0
  if (count > 0 && bins) {
    const end = Math.min(count, Math.max(24, Math.floor(count * 0.35)))
    let sum = 0
    for (let i = 0; i < end; i++) sum += bins[i] || 0
    energy = sum / end / 255
  }
  const raw = Math.max(vol, energy)
  if (raw <= OUTPUT_NOISE) return 0
  return Math.min(1, Math.sqrt((raw - OUTPUT_NOISE) / (1 - OUTPUT_NOISE)) * 1.55)
}

/** Energía de la banda de voz (0–1), sin el refuerzo del orbe. */
export function bandEnergy(bins?: ArrayLike<number> | null): number {
  const count = bins?.length ?? 0
  if (!count || !bins) return 0
  const end = Math.min(count, Math.max(8, Math.floor(count * 0.35)))
  let sum = 0
  for (let i = 0; i < end; i++) sum += bins[i] || 0
  return sum / end / 255
}
