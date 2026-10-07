'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { apiFetch } from '@/lib/apiFetch'
import { primeJoulieAudio, speakJoulie, stopJoulieSpeech } from '@/lib/joulie-speak'
import { supabase } from '@/lib/supabase'
import { JoulieAvatar, type JouliePhase } from '@/components/joulie/JoulieAvatar'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const GREETING =
  'Hola, soy JOULIE, la asistente de AirNation. Te ayudo con eventos, campos, réplicas y equipos.'

type Turn = { role: 'user' | 'assistant'; content: string }
type Mode = 'voice' | 'text'

let sessionAccepted = false
let sessionTurns: Turn[] = []

const PHASE_LABEL: Record<JouliePhase, string> = {
  idle: 'Estoy lista',
  listening: 'Escuchando',
  thinking: 'Pensando',
  speaking: 'Hablando',
}

type RecogResult = { isFinal: boolean } & ArrayLike<{ transcript: string }>

type Recog = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((ev: { results: ArrayLike<RecogResult> }) => void) | null
  onerror: ((ev: { error?: string }) => void) | null
  onend: (() => void) | null
}

function recognitionCtor(): (new () => Recog) | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: new () => Recog
    webkitSpeechRecognition?: new () => Recog
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

function RoundButton({
  label,
  onClick,
  tone = 'ghost',
  children,
}: {
  label: string
  onClick: () => void
  tone?: 'ghost' | 'end'
  children: React.ReactNode
}) {
  const toneClass =
    tone === 'end'
      ? 'bg-[#CC4B37] text-[#FFFFFF]'
      : 'border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[#111111]'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex h-14 w-14 items-center justify-center rounded-full ${toneClass}`}
    >
      {children}
    </button>
  )
}

function MicIcon({ off }: { off?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 11a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 17v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {off ? <path d="M5 5l14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : null}
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function KeyboardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 10h.01M12 10h.01M17 10h.01M7 14h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function JouliePageClient() {
  const router = useRouter()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [consent, setConsent] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<JouliePhase>('idle')
  const [level, setLevel] = useState(0)
  const [caption, setCaption] = useState('Toca para hablar')
  const [liveOn, setLiveOn] = useState(false)
  const [muted, setMuted] = useState(false)
  const [mode, setMode] = useState<Mode>('voice')
  const [draft, setDraft] = useState('')
  const [turns, setTurns] = useState<Turn[]>(sessionTurns)
  const [canListen, setCanListen] = useState(false)

  const liveRef = useRef(false)
  const mutedRef = useRef(false)
  const modeRef = useRef<Mode>('voice')
  const holdRef = useRef(false)
  const busy = useRef(false)
  const ticket = useRef(0)
  const phaseRef = useRef<JouliePhase>('idle')
  const recogRef = useRef<Recog | null>(null)
  const meterStop = useRef<(() => void) | null>(null)
  const restartTimer = useRef<number | null>(null)
  const meterOk = useRef(true)
  const listRef = useRef<HTMLDivElement>(null)
  const beginListenRef = useRef<() => void>(() => {})

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    setMounted(true)
    setCanListen(recognitionCtor() != null)
    let cancel = false
    void supabase
      .from('joulie_config')
      .select('enabled')
      .eq('id', 'singleton')
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancel) return
        if (error || !data || typeof data.enabled !== 'boolean') setEnabled(true)
        else setEnabled(data.enabled)
      })
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (enabled === true && !sessionAccepted) setConsent(true)
  }, [enabled])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [turns, mode])

  function clearRestart() {
    if (restartTimer.current != null) {
      window.clearTimeout(restartTimer.current)
      restartTimer.current = null
    }
  }

  function stopMeterStream() {
    meterStop.current?.()
    meterStop.current = null
  }

  function stopRecog() {
    clearRestart()
    const recog = recogRef.current
    recogRef.current = null
    if (!recog) return
    recog.onresult = null
    recog.onerror = null
    recog.onend = null
    try {
      recog.stop()
    } catch {
      /* ya estaba detenido */
    }
  }

  function startMeter() {
    stopMeterStream()
    const devices = navigator.mediaDevices
    if (!devices?.getUserMedia) return
    void devices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!liveRef.current || mutedRef.current || holdRef.current || modeRef.current !== 'voice') {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        const Ctx =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctx) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        const ctx = new Ctx()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        const bins = new Uint8Array(analyser.frequencyBinCount)
        let frame = 0
        const tick = () => {
          analyser.getByteFrequencyData(bins)
          let sum = 0
          for (let i = 0; i < bins.length; i++) sum += bins[i]
          setLevel(sum / bins.length / 255)
          frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        meterStop.current = () => {
          cancelAnimationFrame(frame)
          stream.getTracks().forEach((track) => track.stop())
          void ctx.close().catch(() => undefined)
        }
      })
      .catch(() => undefined)
  }

  function scheduleListen() {
    clearRestart()
    restartTimer.current = window.setTimeout(() => {
      restartTimer.current = null
      beginListenRef.current()
    }, 280)
  }

  function beginListen() {
    if (!liveRef.current || mutedRef.current || modeRef.current !== 'voice' || holdRef.current) return
    const Ctor = recognitionCtor()
    if (!Ctor) {
      setPhase('idle')
      setLevel(0)
      setCaption('Puedes escribirme. El micrófono no está disponible en este navegador.')
      return
    }
    if (recogRef.current) return
    const recog = new Ctor()
    recog.lang = 'es-MX'
    recog.interimResults = true
    recog.continuous = false
    recog.maxAlternatives = 1
    recogRef.current = recog
    setPhase('listening')
    setLevel(0)
    setCaption('Te escucho')
    const withMeter = meterOk.current
    if (withMeter) startMeter()
    let gotFinal = false
    let blocked: 'denied' | 'capture' | null = null
    recog.onresult = (ev) => {
      let interim = ''
      let finalText = ''
      const results = ev.results
      for (let i = 0; i < results.length; i++) {
        const row = results[i]
        const said = row?.[0]?.transcript || ''
        if (row?.isFinal) finalText += said
        else interim += said
      }
      if (interim.trim()) setCaption(interim.trim())
      const heard = finalText.trim()
      if (!heard) return
      gotFinal = true
      setCaption(heard)
      void ask(heard)
    }
    recog.onerror = (ev) => {
      if (ev.error === 'not-allowed') blocked = 'denied'
      if (ev.error === 'audio-capture') blocked = 'capture'
    }
    recog.onend = () => {
      if (recogRef.current !== recog) return
      recogRef.current = null
      stopMeterStream()
      if (gotFinal || holdRef.current) return
      if (blocked === 'capture' && withMeter) {
        meterOk.current = false
        scheduleListen()
        return
      }
      if (blocked === 'denied' || blocked === 'capture') {
        setPhase('idle')
        setLevel(0)
        setCaption('No pude usar el micrófono. Puedes escribirme.')
        return
      }
      if (liveRef.current && !mutedRef.current && modeRef.current === 'voice') scheduleListen()
      else setPhase('idle')
    }
    try {
      recog.start()
    } catch {
      recogRef.current = null
      stopMeterStream()
      setPhase('idle')
    }
  }

  beginListenRef.current = beginListen

  useEffect(() => {
    return () => {
      liveRef.current = false
      holdRef.current = false
      ticket.current += 1
      clearRestart()
      const recog = recogRef.current
      recogRef.current = null
      if (recog) {
        recog.onresult = null
        recog.onerror = null
        recog.onend = null
        try {
          recog.stop()
        } catch {
          /* ya estaba detenido */
        }
      }
      meterStop.current?.()
      meterStop.current = null
      stopJoulieSpeech()
    }
  }, [])

  async function ask(raw: string) {
    const message = raw.trim()
    if (!message || busy.current) return
    busy.current = true
    holdRef.current = true
    const mine = ++ticket.current
    stopRecog()
    stopMeterStream()
    stopJoulieSpeech()
    setPhase('thinking')
    setLevel(0)
    const history = sessionTurns.slice(-6)
    const next = [...sessionTurns, { role: 'user' as const, content: message }].slice(-12)
    sessionTurns = next
    setTurns(next)
    let reply = 'Ahora no puedo responder. Intenta de nuevo en un momento.'
    try {
      const res = await apiFetch('/joulie', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      })
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
      if (typeof data.reply === 'string' && data.reply.trim()) reply = data.reply.trim()
      else if (typeof data.error === 'string' && data.error.trim()) reply = data.error.trim()
    } catch {
      reply = 'Ahora no puedo responder. Intenta de nuevo en un momento.'
    }
    if (mine !== ticket.current) {
      busy.current = false
      holdRef.current = false
      return
    }
    const withReply = [...sessionTurns, { role: 'assistant' as const, content: reply }].slice(-12)
    sessionTurns = withReply
    setTurns(withReply)
    setCaption(reply)
    setPhase('thinking')
    speakJoulie(reply, {
      onStart: () => {
        if (mine === ticket.current) setPhase('speaking')
      },
      onLevel: (value) => {
        if (mine === ticket.current) setLevel(value)
      },
      onEnd: () => {
        if (mine !== ticket.current) return
        busy.current = false
        holdRef.current = false
        setLevel(0)
        if (liveRef.current && !mutedRef.current && modeRef.current === 'voice') beginListenRef.current()
        else setPhase('idle')
      },
    })
  }

  function endLive() {
    ticket.current += 1
    busy.current = false
    holdRef.current = false
    liveRef.current = false
    mutedRef.current = false
    stopRecog()
    stopMeterStream()
    stopJoulieSpeech()
    setLiveOn(false)
    setMuted(false)
    setPhase('idle')
    setLevel(0)
    setCaption('Toca para hablar')
  }

  function startLive() {
    if (!sessionAccepted) {
      setConsent(true)
      return
    }
    if (liveRef.current && (phaseRef.current === 'speaking' || phaseRef.current === 'thinking')) {
      ticket.current += 1
      busy.current = false
      holdRef.current = false
      stopJoulieSpeech()
      stopRecog()
      beginListen()
      return
    }
    if (liveRef.current) return
    primeJoulieAudio()
    liveRef.current = true
    mutedRef.current = false
    modeRef.current = 'voice'
    setMode('voice')
    setLiveOn(true)
    setMuted(false)
    beginListen()
  }

  function toggleMute() {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    if (next) {
      stopRecog()
      stopMeterStream()
      setLevel(0)
      if (!holdRef.current) {
        setPhase('idle')
        setCaption('Micrófono silenciado')
      }
      return
    }
    if (liveRef.current && !holdRef.current && modeRef.current === 'voice') beginListen()
  }

  function openText() {
    modeRef.current = 'text'
    setMode('text')
    stopRecog()
    stopMeterStream()
    setLevel(0)
    if (!holdRef.current) setPhase('idle')
  }

  function backToVoice() {
    primeJoulieAudio()
    modeRef.current = 'voice'
    setMode('voice')
    liveRef.current = true
    mutedRef.current = false
    setLiveOn(true)
    setMuted(false)
    if (!holdRef.current) beginListen()
  }

  function acceptConsent() {
    primeJoulieAudio()
    sessionAccepted = true
    setConsent(false)
    const next = [...sessionTurns, { role: 'assistant' as const, content: GREETING }].slice(-12)
    sessionTurns = next
    setTurns(next)
    modeRef.current = 'voice'
    setMode('voice')
    liveRef.current = true
    mutedRef.current = false
    setLiveOn(true)
    setMuted(false)
    holdRef.current = true
    busy.current = true
    const mine = ++ticket.current
    setCaption(GREETING)
    setPhase('thinking')
    speakJoulie(GREETING, {
      onStart: () => {
        if (mine === ticket.current) setPhase('speaking')
      },
      onLevel: (value) => {
        if (mine === ticket.current) setLevel(value)
      },
      onEnd: () => {
        if (mine !== ticket.current) return
        busy.current = false
        holdRef.current = false
        setLevel(0)
        if (liveRef.current && !mutedRef.current && modeRef.current === 'voice') beginListenRef.current()
        else setPhase('idle')
      },
    })
  }

  const frame = 'flex h-[calc(100dvh-4rem-12px)] flex-col bg-[#F4F4F4] lg:h-[calc(100dvh-4rem)]'

  if (enabled === null) return <div className={frame} />

  if (enabled === false) {
    return (
      <div className={`${frame} items-center justify-center px-6`}>
        <p className="text-center text-[15px] leading-relaxed text-[#666666]" style={lato}>
          Joulie no está disponible por ahora.
        </p>
      </div>
    )
  }

  const consentModal =
    consent && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/60 pb-6 pt-6 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="joulie-consent-title"
          >
            <div className="relative my-auto w-full max-w-md bg-[#FFFFFF] p-5 shadow-xl sm:rounded-[2px]">
              <h2 id="joulie-consent-title" style={jost} className="text-[16px] text-[#111111]">
                Joulie en beta
              </h2>
              <p style={lato} className="mt-3 text-[13px] leading-relaxed text-[#666666]">
                Estoy en beta. El texto lo responde un proveedor de inteligencia artificial y la voz puede salir de un servicio de voz. Si no está disponible, habla este dispositivo.
              </p>
              <p style={lato} className="mt-2 text-[13px] leading-relaxed text-[#666666]">
                No compartas datos personales. No guardo esta conversación: se pierde al cerrar o recargar la página.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  style={jost}
                  className="flex h-12 flex-1 items-center justify-center rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] tracking-wide text-[#111111]"
                >
                  Ahora no
                </button>
                <button
                  type="button"
                  onClick={acceptConsent}
                  style={jost}
                  className="flex h-12 flex-1 items-center justify-center rounded-[2px] bg-[#CC4B37] text-[11px] tracking-wide text-[#FFFFFF]"
                >
                  Sí, continuar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  if (mode === 'text') {
    return (
      <>
        <div className={`${frame} overflow-hidden`}>
          <div className="flex items-center justify-between px-5 pt-4">
            <p className="text-[13px] tracking-[0.18em] text-[#111111]" style={jost}>
              Joulie
            </p>
            <RoundButton label="Volver a voz" onClick={backToVoice}>
              <MicIcon />
            </RoundButton>
          </div>
          <div className="flex justify-center py-2">
            <JoulieAvatar phase={phase} level={level} size={88} label={PHASE_LABEL[phase]} />
          </div>
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
            {turns.length === 0 ? (
              <p className="text-center text-[15px] leading-relaxed text-[#666666]" style={lato}>
                Pregúntame por eventos, réplicas, campos o equipos.
              </p>
            ) : (
              turns.map((turn, index) => (
                <div key={`${turn.role}-${index}`}>
                  <p className="text-[10px] tracking-wide text-[#999999]" style={jost}>
                    {turn.role === 'user' ? 'Tú' : 'Joulie'}
                  </p>
                  <p className="text-[15px] leading-relaxed text-[#111111]" style={lato}>
                    {turn.content}
                  </p>
                </div>
              ))
            )}
          </div>
          <form
            className="flex items-center gap-3 px-4 pb-6"
            onSubmit={(event) => {
              event.preventDefault()
              const text = draft
              setDraft('')
              void ask(text)
            }}
          >
            <label className="sr-only" htmlFor="joulie-input">
              Pregunta para Joulie
            </label>
            <input
              id="joulie-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe tu pregunta"
              maxLength={500}
              className="h-12 flex-1 rounded-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
              style={lato}
            />
            <button
              type="submit"
              aria-label="Enviar"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#CC4B37] text-[#FFFFFF]"
            >
              <SendIcon />
            </button>
          </form>
        </div>
        {consentModal}
      </>
    )
  }

  return (
    <>
      <div className={frame}>
        <div className="flex flex-1 flex-col items-center justify-center px-6">
          <p className="mb-8 text-[11px] tracking-[0.22em] text-[#767676]" style={jost}>
            Joulie
          </p>
          <button
            type="button"
            onClick={startLive}
            className="rounded-full border-0 bg-transparent p-0"
            aria-label={liveOn ? PHASE_LABEL[phase] : 'Toca para hablar'}
          >
            <JoulieAvatar phase={phase} level={level} size={208} label={PHASE_LABEL[phase]} />
          </button>
          <p
            className="mt-10 max-w-sm text-center text-[15px] leading-relaxed text-[#444444] line-clamp-4 min-h-[4.5rem]"
            style={lato}
            aria-live="polite"
          >
            {caption}
          </p>
        </div>
        <div className="flex items-center justify-center gap-8 pb-8">
          {liveOn ? (
            <RoundButton label={muted ? 'Activar micrófono' : 'Silenciar micrófono'} onClick={toggleMute}>
              <MicIcon off={muted} />
            </RoundButton>
          ) : null}
          {liveOn ? (
            <RoundButton label="Terminar" onClick={endLive} tone="end">
              <CloseIcon />
            </RoundButton>
          ) : null}
          <RoundButton label="Escribir" onClick={openText}>
            <KeyboardIcon />
          </RoundButton>
        </div>
        {!canListen && !liveOn ? (
          <p className="sr-only">Puedes escribirme. El micrófono no está disponible en este navegador.</p>
        ) : null}
      </div>
      {consentModal}
    </>
  )
}
