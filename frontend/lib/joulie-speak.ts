import { apiFetch } from '@/lib/apiFetch'
import { pickJoulieVoice, type VoiceLike } from '@/lib/joulie-voice'

/**
 * Único punto de salida de voz de JOULIE.
 * Primero pide el audio a Railway (ElevenLabs, la llave no sale del servidor).
 * Si no hay llave, el plan no alcanza o falla la red, habla el dispositivo.
 *
 * primeJoulieAudio() tiene que correr dentro del tap (el Aceptar del consentimiento
 * o el toque a la esfera). Ese gesto desbloquea el audio; el mp3 llega después.
 */

export type SpeakHandlers = {
  onStart?: () => void
  onEnd?: () => void
  onLevel?: (level: number) => void
}

type SpeakResult = 'ok' | 'fallback' | 'aborted'

const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

let generation = 0
let primeToken = 0
let currentAudio: HTMLAudioElement | null = null
let currentUrl: string | null = null
let meterFrame = 0
let sharedContext: AudioContext | null = null
let unlockedAudio: HTMLAudioElement | null = null
let elementSource: MediaElementAudioSourceNode | null = null
let elementAnalyser: AnalyserNode | null = null
let meteredElement: HTMLAudioElement | null = null

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  )
}

function ensureContext(): AudioContext | null {
  const Ctor = audioContextCtor()
  if (!Ctor) return null
  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new Ctor()
    elementSource = null
    elementAnalyser = null
    meteredElement = null
  }
  return sharedContext
}

function stopMeter() {
  if (meterFrame) cancelAnimationFrame(meterFrame)
  meterFrame = 0
}

export function stopJoulieSpeech() {
  generation += 1
  primeToken += 1
  stopMeter()
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl)
    currentUrl = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

function releaseUrl() {
  if (currentUrl) URL.revokeObjectURL(currentUrl)
  currentUrl = null
  currentAudio = null
}

/** Llamar de forma síncrona dentro del click. No espera red. */
export function primeJoulieAudio() {
  if (typeof window === 'undefined') return
  const ctx = ensureContext()
  if (ctx) {
    void ctx.resume()
    try {
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start()
    } catch {
      /* el elemento de audio es el desbloqueo que importa */
    }
  }

  try {
    const audio = unlockedAudio ?? new Audio()
    unlockedAudio = audio
    audio.setAttribute('playsinline', 'true')
    audio.muted = true
    const token = ++primeToken
    audio.src = SILENT_WAV
    const pending = audio.play()
    if (pending) {
      void pending
        .then(() => {
          if (token !== primeToken) return
          audio.pause()
          audio.muted = false
        })
        .catch(() => {
          audio.muted = false
        })
    }
  } catch {
    /* sin desbloqueo, el play posterior puede fallar y cae al dispositivo */
  }

  try {
    if (window.speechSynthesis) {
      const primer = new SpeechSynthesisUtterance(' ')
      primer.volume = 0
      primer.lang = 'es-MX'
      window.speechSynthesis.speak(primer)
    }
  } catch {
    /* el fallback de voz igual intenta hablar */
  }
}

function attachLevelMeter(audio: HTMLAudioElement, handlers?: SpeakHandlers) {
  const ctx = ensureContext()
  if (!ctx) return
  void ctx.resume()
  try {
    if (meteredElement !== audio) {
      if (ctx.state !== 'running') return
      elementSource = ctx.createMediaElementSource(audio)
      meteredElement = audio
      elementAnalyser = ctx.createAnalyser()
      elementAnalyser.fftSize = 256
      elementSource.connect(elementAnalyser)
      elementAnalyser.connect(ctx.destination)
    }
    const analyser = elementAnalyser
    if (!analyser) return
    const bins = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(bins)
      let sum = 0
      for (let i = 0; i < bins.length; i++) sum += bins[i]
      handlers?.onLevel?.(sum / bins.length / 255)
      meterFrame = requestAnimationFrame(tick)
    }
    stopMeter()
    meterFrame = requestAnimationFrame(tick)
  } catch {
    /* sin medidor, la esfera igual pulsa */
  }
}

async function speakWithServer(
  text: string,
  handlers: SpeakHandlers | undefined,
  mine: number
): Promise<SpeakResult> {
  let res: Response
  try {
    res = await apiFetch('/joulie/voz', {
      method: 'POST',
      body: JSON.stringify({ text: text.slice(0, 500) }),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    return mine === generation ? 'fallback' : 'aborted'
  }

  if (mine !== generation) return 'aborted'

  const type = res.headers.get('content-type') || ''
  if (!res.ok || !type.includes('audio')) return 'fallback'

  const blob = await res.blob()
  if (mine !== generation) return 'aborted'

  const url = URL.createObjectURL(blob)
  const audio = unlockedAudio ?? new Audio()
  unlockedAudio = audio
  primeToken += 1
  audio.muted = false
  audio.setAttribute('playsinline', 'true')
  audio.pause()
  if (currentUrl) URL.revokeObjectURL(currentUrl)
  audio.src = url
  currentAudio = audio
  currentUrl = url
  attachLevelMeter(audio, handlers)

  return await new Promise<SpeakResult>((resolve) => {
    let settled = false
    const fail = () => {
      if (settled) return
      settled = true
      audio.pause()
      stopMeter()
      releaseUrl()
      resolve(mine === generation ? 'fallback' : 'aborted')
    }
    const succeed = () => {
      if (settled) return
      settled = true
      stopMeter()
      releaseUrl()
      handlers?.onEnd?.()
      resolve('ok')
    }
    audio.onplay = () => handlers?.onStart?.()
    audio.onended = succeed
    audio.onerror = fail
    void audio.play().catch(fail)
    window.setTimeout(() => {
      if (!settled && audio.paused) fail()
    }, 2500)
  })
}

function deviceVoices(): VoiceLike[] {
  const list = window.speechSynthesis.getVoices()
  return list.map((voice) => ({ lang: voice.lang, name: voice.name, voiceURI: voice.voiceURI }))
}

function speakWithDevice(text: string, handlers?: SpeakHandlers) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    handlers?.onEnd?.()
    return
  }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-MX'
  const applyVoice = () => {
    const picked = pickJoulieVoice(deviceVoices())
    if (!picked) return
    const match = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.voiceURI === picked.voiceURI && voice.name === picked.name)
    if (match) utterance.voice = match
  }
  applyVoice()
  let ended = false
  let started = false
  const finish = () => {
    if (ended) return
    ended = true
    handlers?.onEnd?.()
  }
  utterance.onstart = () => handlers?.onStart?.()
  utterance.onboundary = () => handlers?.onLevel?.(0.85)
  utterance.onend = finish
  utterance.onerror = finish
  const start = () => {
    if (started) return
    started = true
    applyVoice()
    window.speechSynthesis.speak(utterance)
  }
  if (window.speechSynthesis.getVoices().length) start()
  else {
    const previous = window.speechSynthesis.onvoiceschanged
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = previous ?? null
      start()
    }
    window.setTimeout(start, 300)
  }
}

export function speakJoulie(text: string, handlers?: SpeakHandlers) {
  const cleaned = text.trim()
  if (!cleaned) {
    handlers?.onEnd?.()
    return
  }
  stopJoulieSpeech()
  const mine = generation
  void (async () => {
    const result = await speakWithServer(cleaned, handlers, mine)
    if (result === 'aborted' || mine !== generation) return
    if (result === 'fallback') speakWithDevice(cleaned, handlers)
  })()
}
