'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { apiFetch } from '@/lib/apiFetch'
import { supabase } from '@/lib/supabase'
import { JoulieAvatar, type JouliePhase } from '@/components/joulie/JoulieAvatar'
import { TALK_START, callClock, hearingNow, outputLevel, shouldHangUp, trackTalk, voiceFace } from '@/lib/joulie-voice'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const GREETING = 'Hola, soy JOULIE. ¿En qué te ayudo?'

const UNAVAILABLE = 'Joulie no está disponible por ahora.'

type Turn = { role: 'user' | 'assistant'; content: string }
type Mode = 'voice' | 'text'

let sessionAccepted = false
let sessionTurns: Turn[] = []

const PHASE_LABEL: Record<JouliePhase, string> = {
  idle: 'Estoy lista',
  listening: 'Escuchando',
  hearing: 'Te escucho…',
  thinking: 'Pensando',
  speaking: 'JOULIE está hablando',
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
  return (
    <ConversationProvider>
      <JoulieLive />
    </ConversationProvider>
  )
}

function JoulieLive() {
  const router = useRouter()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [consent, setConsent] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<Mode>('voice')
  const [phase, setPhase] = useState<JouliePhase>('idle')
  const [level, setLevel] = useState(0)
  const [hearing, setHearing] = useState(false)
  const [notice, setNotice] = useState('')
  const [liveOn, setLiveOn] = useState(false)
  const [muted, setMuted] = useState(false)
  const [turns, setTurns] = useState<Turn[]>(sessionTurns)
  const [draft, setDraft] = useState('')
  const waiting = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const vadAt = useRef(0)
  const nudged = useRef(false)
  const byeSent = useRef(false)
  const [hangup, setHangup] = useState(false)
  const conversation = useConversation({
    micMuted: muted,
    onVadScore: ({ vadScore }) => {
      if (vadScore >= 0.5) vadAt.current = performance.now()
    },
    onMessage: (payload) => {
      const text = payload.message?.trim()
      if (text) {
        const role: Turn['role'] = payload.source === 'user' ? 'user' : 'assistant'
        const prev = sessionTurns[sessionTurns.length - 1]
        const grown =
          prev &&
          prev.role === role &&
          (text === prev.content || text.startsWith(prev.content) || prev.content.startsWith(text))
        const content = grown && prev.content.length > text.length ? prev.content : text
        const next = grown
          ? [...sessionTurns.slice(0, -1), { role, content }]
          : [...sessionTurns, { role, content }].slice(-12)
        sessionTurns = next
        setTurns(next)
        if (role === 'assistant' && shouldHangUp(content)) setHangup(true)
      }
      if (payload.source === 'user') {
        waiting.current = true
        setPhase('thinking')
      }
    },
    onError: () => {
      setNotice('No pude conectar la voz. Intenta de nuevo.')
      setPhase('idle')
      setLiveOn(false)
    },
    onDisconnect: () => {
      waiting.current = false
      byeSent.current = false
      setHangup(false)
      setLiveOn(false)
      setPhase('idle')
      setLevel(0)
    },
  })
  const {
    status,
    mode: agentMode,
    startSession,
    endSession,
    sendUserMessage,
    sendUserActivity,
    getInputVolume,
    getOutputVolume,
    getOutputByteFrequencyData,
  } = conversation
  const endRef = useRef(endSession)
  endRef.current = endSession

  useEffect(() => {
    setMounted(true)
    setConsent(!sessionAccepted)
    let cancelled = false
    supabase
      .from('joulie_config')
      .select('enabled')
      .eq('id', 'singleton')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setEnabled(data?.enabled !== false)
      })
    return () => {
      cancelled = true
      endRef.current()
    }
  }, [])

  useEffect(() => {
    if (status === 'connecting') {
      setPhase('thinking')
      return
    }
    if (status !== 'connected') return
    if (agentMode === 'speaking') {
      waiting.current = false
      setPhase('speaking')
      return
    }
    if (!waiting.current) setPhase('listening')
  }, [status, agentMode])

  useEffect(() => {
    if (!hangup || status !== 'connected') return
    if (agentMode === 'speaking') return
    const timer = window.setTimeout(() => endRef.current(), 400)
    return () => window.clearTimeout(timer)
  }, [hangup, agentMode, status])

  useEffect(() => {
    if (status !== 'connected') return
    const started = Date.now()
    const timer = window.setInterval(() => {
      const clock = callClock(Date.now() - started)
      if (clock === 'end') {
        endRef.current()
        return
      }
      if (clock === 'bye' && !byeSent.current) {
        byeSent.current = true
        sendUserMessage('ya me voy')
      }
    }, 500)
    return () => window.clearInterval(timer)
  }, [status, sendUserMessage])

  useEffect(() => {
    if (status !== 'connected') return
    let frame = 0
    let talk = TALK_START
    const tick = () => {
      const now = performance.now()
      const raw = getInputVolume()
      const mic = muted || !Number.isFinite(raw) ? 0 : raw
      talk = trackTalk(talk, mic, now)
      const userTalking = hearingNow(talk.talking, vadAt.current, now, muted)
      if (userTalking && agentMode === 'speaking') {
        if (!nudged.current) {
          nudged.current = true
          sendUserActivity()
        }
      } else if (agentMode !== 'speaking') {
        nudged.current = false
      }
      setHearing(userTalking)
      const next =
        agentMode === 'speaking' && !userTalking
          ? outputLevel(getOutputVolume(), getOutputByteFrequencyData())
          : mic
      const shownLevel = Math.round(next * 100) / 100
      setLevel((prev) => (prev === shownLevel ? prev : shownLevel))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      setHearing(false)
    }
  }, [status, agentMode, muted, getInputVolume, getOutputVolume, getOutputByteFrequencyData, sendUserActivity])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [turns, mode])

  async function beginVoice() {
    if (busy.current) return
    busy.current = true
    waiting.current = false
    setPhase('thinking')
    setNotice('')
    setLiveOn(true)
    try {
      const res = await apiFetch('/joulie/sesion', { method: 'POST', body: '{}' })
      const data = (await res.json().catch(() => ({}))) as { token?: string; session?: string; error?: string }
      if (!res.ok || !data.token || !data.session) {
        setNotice(data.error || UNAVAILABLE)
        setPhase('idle')
        setLiveOn(false)
        return
      }
      await Promise.resolve(
        startSession({
          conversationToken: data.token,
          connectionType: 'webrtc',
          dynamicVariables: { joulie_session: data.session },
          overrides: { agent: { firstMessage: GREETING, language: 'es' } },
        })
      )
    } catch {
      setNotice('No pude conectar la voz. Intenta de nuevo.')
      setPhase('idle')
      setLiveOn(false)
    } finally {
      busy.current = false
    }
  }

  function acceptConsent() {
    sessionAccepted = true
    setConsent(false)
    void beginVoice()
  }

  function startLive() {
    if (!sessionAccepted) {
      setConsent(true)
      return
    }
    if (status === 'connected' && (phase === 'speaking' || phase === 'thinking')) {
      sendUserActivity()
      return
    }
    if (status === 'disconnected' || status === 'error') void beginVoice()
  }

  function endLive() {
    endSession()
    waiting.current = false
    setLiveOn(false)
    setMuted(false)
    setPhase('idle')
    setLevel(0)
    setNotice('')
  }

  function openText() {
    endSession()
    setLiveOn(false)
    setPhase('idle')
    setLevel(0)
    setMode('text')
  }

  function backToVoice() {
    setMode('voice')
    setNotice('')
    setPhase('idle')
  }

  async function ask(raw: string) {
    const message = raw.trim()
    if (!message || busy.current) return
    busy.current = true
    setPhase('thinking')
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
    setPhase('idle')
    busy.current = false
  }

  const shown: JouliePhase = voiceFace(phase, hearing)
  const frame = 'flex h-[calc(100dvh-4rem-12px)] flex-col bg-[#F4F4F4] lg:h-[calc(100dvh-4rem)]'

  if (enabled === null) return <div className={frame} />

  if (enabled === false) {
    return (
      <div className={`${frame} items-center justify-center px-6`}>
        <p className="text-center text-[15px] leading-relaxed text-[#666666]" style={lato}>
          {UNAVAILABLE}
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
                Estoy en beta. El texto lo responde un proveedor de inteligencia artificial y la voz, un servicio de voz.
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
          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
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
          <p className="relative z-20 bg-[#F4F4F4] px-4 text-[11px] tracking-[0.22em] text-[#767676]" style={jost}>
            Joulie
          </p>
          <div className="joulie-stage">
            <button
              type="button"
              onClick={startLive}
              className="rounded-full border-0 bg-transparent p-0"
              aria-label={liveOn ? PHASE_LABEL[shown] : 'Toca para hablar'}
            >
              <JoulieAvatar phase={shown} level={level} size={208} label={PHASE_LABEL[shown]} />
            </button>
          </div>
          <p
            className="relative z-20 min-h-4 max-w-sm bg-[#F4F4F4] px-4 text-center text-[11px] tracking-[0.22em] text-[#767676]"
            style={jost}
            aria-live="polite"
          >
            {liveOn ? PHASE_LABEL[shown] : notice}
          </p>
        </div>
        <div className="flex items-center justify-center gap-8 pb-8">
          {liveOn ? (
            <RoundButton label={muted ? 'Activar micrófono' : 'Silenciar micrófono'} onClick={() => setMuted((value) => !value)}>
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
      </div>
      {consentModal}
    </>
  )
}
