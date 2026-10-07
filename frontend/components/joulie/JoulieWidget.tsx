'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiFetch } from '@/lib/apiFetch'
import { speakJoulie, stopJoulieSpeech } from '@/lib/joulie-speak'
import { supabase } from '@/lib/supabase'
import { JoulieAvatar, type JouliePhase } from '@/components/joulie/JoulieAvatar'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type Turn = { role: 'user' | 'assistant'; content: string }

// ponytail: memoria del módulo. Sobrevive un cambio de sección y se pierde al recargar.
let sessionAccepted = false
let sessionTurns: Turn[] = []

const PHASE_LABEL: Record<JouliePhase, string> = {
  idle: 'Estoy lista',
  listening: 'Escuchando',
  thinking: 'Pensando',
  speaking: 'Hablando',
}

type Recog = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
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

export default function JoulieWidget() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const [consent, setConsent] = useState(false)
  const [phase, setPhase] = useState<JouliePhase>('idle')
  const [level, setLevel] = useState(0)
  const [draft, setDraft] = useState('')
  const [turns, setTurns] = useState<Turn[]>(sessionTurns)
  const [canListen, setCanListen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const busy = useRef(false)
  const ticket = useRef(0)
  const meterStop = useRef<(() => void) | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [turns, open])

  useEffect(() => () => stopJoulieSpeech(), [])

  if (enabled !== true) return null

  function close() {
    ticket.current += 1
    meterStop.current?.()
    meterStop.current = null
    stopJoulieSpeech()
    setPhase('idle')
    setLevel(0)
    setOpen(false)
    setConsent(false)
  }

  function openJoulie() {
    if (sessionAccepted) setOpen(true)
    else setConsent(true)
  }

  async function ask(raw: string) {
    const message = raw.trim()
    if (!message || busy.current) return
    busy.current = true
    ticket.current += 1
    const mine = ticket.current
    meterStop.current?.()
    stopJoulieSpeech()
    setDraft('')
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
    const withReply = [...sessionTurns, { role: 'assistant' as const, content: reply }].slice(-12)
    sessionTurns = withReply
    setTurns(withReply)
    busy.current = false
    if (mine !== ticket.current) return
    setPhase('speaking')
    speakJoulie(reply, {
      onStart: () => {
        if (mine === ticket.current) setPhase('speaking')
      },
      onLevel: (value) => {
        if (mine === ticket.current) setLevel(value)
      },
      onEnd: () => {
        if (mine !== ticket.current) return
        setPhase('idle')
        setLevel(0)
      },
    })
  }

  function listen() {
    const Ctor = recognitionCtor()
    if (!Ctor || busy.current) return
    const recog = new Ctor()
    recog.lang = 'es-MX'
    recog.interimResults = false
    recog.maxAlternatives = 1
    setPhase('listening')
    setLevel(0.2)
    // ponytail: el reconocedor y getUserMedia pueden pelearse por el micrófono
    // en algunos WebView. Si el medidor falla, la esfera igual muestra "Escuchando".
    void navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((stream) => {
        const ctx = new AudioContext()
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
      .catch(() => setLevel(0.35))
    recog.onresult = (ev) => {
      const said = ev.results?.[0]?.[0]?.transcript || ''
      meterStop.current?.()
      meterStop.current = null
      if (said.trim()) void ask(said)
      else setPhase('idle')
    }
    recog.onerror = () => {
      meterStop.current?.()
      meterStop.current = null
      setPhase('idle')
      setLevel(0)
    }
    recog.onend = () => {
      meterStop.current?.()
      meterStop.current = null
    }
    try {
      recog.start()
    } catch {
      setPhase('idle')
    }
  }

  const launcher = (
    <button
      type="button"
      onClick={openJoulie}
      className="fixed z-[60] right-4 flex flex-col items-center gap-1 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6"
      aria-label="Abrir Joulie. Estoy lista"
    >
      <JoulieAvatar phase="idle" size={56} label="Joulie" />
      <span className="text-[9px] font-bold uppercase tracking-wider text-[#767676]" style={jost}>
        Joulie
      </span>
    </button>
  )

  const panel = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="joulie-title"
      className="fixed z-[60] right-3 flex w-[min(100%-1.5rem,22rem)] flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4 shadow-xl bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-6"
      style={{ borderRadius: 2 }}
    >
      <div className="flex items-center gap-3">
        <JoulieAvatar phase={phase} level={level} size={52} label={PHASE_LABEL[phase]} />
        <div className="min-w-0 flex-1">
          <h2 id="joulie-title" className="text-[16px] text-[#111111]" style={jost}>
            Joulie
          </h2>
          <p className="text-[12px] text-[#666666]" style={lato} aria-live="polite">
            {PHASE_LABEL[phase]}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          className="text-[11px] text-[#666666]"
          style={jost}
          aria-label="Cerrar Joulie"
        >
          Cerrar
        </button>
      </div>

      <div ref={listRef} className="mt-3 max-h-64 space-y-3 overflow-y-auto">
        {turns.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-[#666666]" style={lato}>
            Pregúntame por eventos, réplicas, campos o equipos. Estoy lista.
          </p>
        ) : (
          turns.map((turn, index) => (
            <div key={`${turn.role}-${index}`}>
              <p className="text-[10px] tracking-wide text-[#999999]" style={jost}>
                {turn.role === 'user' ? 'Tú' : 'Joulie'}
              </p>
              <p className="text-[13px] leading-relaxed text-[#111111]" style={lato}>
                {turn.content}
              </p>
            </div>
          ))
        )}
      </div>

      {!canListen ? (
        <p className="mt-3 text-[12px] text-[#666666]" style={lato}>
          Puedes escribirme. El micrófono no está disponible en este navegador.
        </p>
      ) : null}

      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void ask(draft)
        }}
      >
        <label className="sr-only" htmlFor="joulie-input" style={lato}>
          Pregunta para Joulie
        </label>
        <input
          id="joulie-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escribe tu pregunta"
          maxLength={500}
          className="w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#CC4B37]"
          style={lato}
        />
        <div className="flex gap-2">
          {canListen ? (
            <button
              type="button"
              onClick={listen}
              className="flex h-12 flex-1 items-center justify-center border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] tracking-wide text-[#111111]"
              style={jost}
            >
              Hablar
            </button>
          ) : null}
          <button
            type="submit"
            className="flex h-12 flex-1 items-center justify-center bg-[#CC4B37] text-[11px] tracking-wide text-[#FFFFFF]"
            style={jost}
          >
            Enviar
          </button>
        </div>
        {phase === 'speaking' ? (
          <button
            type="button"
            onClick={() => {
              ticket.current += 1
              stopJoulieSpeech()
              setPhase('idle')
              setLevel(0)
            }}
            className="text-[13px] font-bold text-[#444444] underline underline-offset-2"
            style={lato}
          >
            Detener voz
          </button>
        ) : null}
      </form>
    </div>
  ) : null

  const consentModal =
    consent && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/60 pb-6 pt-6 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="joulie-consent-title"
          >
            <div
              className="relative my-auto w-full max-w-md bg-[#FFFFFF] p-5 shadow-xl sm:rounded-[2px]"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id="joulie-consent-title" style={jost} className="text-[16px] text-[#111111]">
                Joulie en beta
              </h2>
              <p style={lato} className="mt-3 text-[13px] leading-relaxed text-[#666666]">
                Estoy en beta. La voz la procesa el servicio de voz de tu dispositivo. El texto lo responde un proveedor de inteligencia artificial.
              </p>
              <p style={lato} className="mt-2 text-[13px] leading-relaxed text-[#666666]">
                No compartas datos personales. No guardo esta conversación: se pierde al cerrar o recargar la página.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  style={jost}
                  className="flex h-12 flex-1 items-center justify-center rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] tracking-wide text-[#111111]"
                >
                  Ahora no
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sessionAccepted = true
                    setConsent(false)
                    setOpen(true)
                  }}
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

  return (
    <>
      {open ? panel : launcher}
      {consentModal}
    </>
  )
}
