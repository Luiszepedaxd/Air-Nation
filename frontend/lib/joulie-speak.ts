import { apiFetch } from '@/lib/apiFetch'
import { pickJoulieVoice, type VoiceLike } from '@/lib/joulie-voice'

/**
 * Único punto de salida de voz de JOULIE.
 * Primero pide el audio a Railway (ElevenLabs, la llave no sale del servidor).
 * Si no hay llave, el plan no alcanza o falla la red, habla el dispositivo.
 */

export type SpeakHandlers = {
  onStart?: () => void
  onEnd?: () => void
  onLevel?: (level: number) => void
}

let generation = 0
let currentAudio: HTMLAudioElement | null = null
let currentUrl: string | null = null
let meterFrame = 0
let meterContext: AudioContext | null = null

function stopMeter() {
  if (meterFrame) cancelAnimationFrame(meterFrame)
  meterFrame = 0
  if (meterContext) {
    void meterContext.close().catch(() => undefined)
    meterContext = null
  }
}

export function stopJoulieSpeech() {
  generation += 1
  stopMeter()
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
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

async function speakWithServer(text: string, handlers?: SpeakHandlers): Promise<boolean> {
  let res: Response
  try {
    res = await apiFetch('/joulie/voz', {
      method: 'POST',
      body: JSON.stringify({ text: text.slice(0, 500) }),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    return false
  }

  const type = res.headers.get('content-type') || ''
  if (!res.ok || !type.includes('audio')) return false

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  currentAudio = audio
  currentUrl = url

  try {
    const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctx) {
      const ctx = new Ctx()
      meterContext = ctx
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyser.connect(ctx.destination)
      const bins = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(bins)
        let sum = 0
        for (let i = 0; i < bins.length; i++) sum += bins[i]
        handlers?.onLevel?.(sum / bins.length / 255)
        meterFrame = requestAnimationFrame(tick)
      }
      meterFrame = requestAnimationFrame(tick)
    }
  } catch {
    /* sin medidor, la esfera igual pulsa */
  }

  return await new Promise<boolean>((resolve) => {
    let settled = false
    const fail = () => {
      if (settled) return
      settled = true
      audio.pause()
      stopMeter()
      releaseUrl()
      resolve(false)
    }
    const succeed = () => {
      if (settled) return
      settled = true
      stopMeter()
      releaseUrl()
      handlers?.onEnd?.()
      resolve(true)
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
    const played = await speakWithServer(cleaned, handlers)
    if (mine !== generation) return
    if (!played) speakWithDevice(cleaned, handlers)
  })()
}
