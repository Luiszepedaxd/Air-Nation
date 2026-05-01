'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { isNativeApp, isAndroidWeb } from '@/lib/platform'

const STORAGE_KEY = 'airnation_beta_dismissed'
const ANDROID_BANNER_KEY = 'airnation_android_play_dismissed'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.atomikapps.airnation'

const CATEGORIAS = [
  'General',
  'Bug o error',
  'Sugerencia de función',
  'Diseño',
  'Otro',
] as const

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800 as const,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[#111111] outline-none focus:border-[#CC4B37]'

export default function BetaBanner() {
  const [hydrated, setHydrated] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const [isAndroidWebPlatform, setIsAndroidWebPlatform] = useState(false)

  const [storageReady, setStorageReady] = useState(false)
  const [sessionDismissed, setSessionDismissed] = useState(false)
  const [androidDismissed, setAndroidDismissed] = useState(false)
  const [thanksPhase, setThanksPhase] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0])
  const [mensaje, setMensaje] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Detección de plataforma — solo client-side
  useEffect(() => {
    setIsNative(isNativeApp())
    setIsAndroidWebPlatform(isAndroidWeb())
    setHydrated(true)
  }, [])

  useEffect(() => {
    setPortalEl(document.body)
  }, [])

  useEffect(() => {
    try {
      setSessionDismissed(sessionStorage.getItem(STORAGE_KEY) === 'true')
      setAndroidDismissed(
        sessionStorage.getItem(ANDROID_BANNER_KEY) === 'true'
      )
    } catch {
      setSessionDismissed(false)
      setAndroidDismissed(false)
    }
    setStorageReady(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      const u = data.user
      setUserId(u?.id ?? null)
      if (u?.email) setEmail((prev) => (prev.trim() ? prev : u.email ?? ''))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const openModal = useCallback(() => {
    setSubmitError('')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (sending) return
    setModalOpen(false)
  }, [sending])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, closeModal])

  const dismissBetaBanner = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      /* ignore */
    }
    setSessionDismissed(true)
    setThanksPhase(false)
  }, [])

  const dismissAndroidBanner = useCallback(() => {
    try {
      sessionStorage.setItem(ANDROID_BANNER_KEY, 'true')
    } catch {
      /* ignore */
    }
    setAndroidDismissed(true)
  }, [])

  useEffect(() => {
    if (!thanksPhase) return
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true')
      } catch {
        /* ignore */
      }
      setSessionDismissed(true)
      setThanksPhase(false)
    }, 3000)
    return () => window.clearTimeout(t)
  }, [thanksPhase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = mensaje.trim()
    if (!trimmed || sending) return
    setSending(true)
    setSubmitError('')
    const result = await api.feedback.submit({
      categoria,
      mensaje: trimmed,
      email: email.trim() || null,
      user_id: userId,
    })
    setSending(false)
    if (!result.success) {
      setSubmitError(result.error || 'No se pudo enviar. Intenta de nuevo.')
      return
    }
    setModalOpen(false)
    setMensaje('')
    setThanksPhase(true)
  }

  // 1. App nativa: no renderiza absolutamente nada.
  if (!hydrated) return null
  if (isNative) return null

  // 2. Web Android (no nativa): banner "descarga la app de Play Store".
  if (isAndroidWebPlatform) {
    if (!storageReady || androidDismissed) return null
    return (
      <div
        className="relative z-[40] w-full px-4 py-3 text-white"
        style={{ backgroundColor: '#111111', padding: '12px 16px' }}
      >
        <button
          type="button"
          onClick={dismissAndroidBanner}
          className="absolute right-4 top-3 text-white opacity-60 hover:opacity-100"
          aria-label="Cerrar aviso"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="pr-8">
          <div className="flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-x-2">
            <span
              className="block shrink-0 font-bold leading-snug"
              style={latoBody}
            >
              AirNation ya está en Google Play
            </span>
            <span
              className="block text-sm leading-snug text-white/95 md:inline md:text-sm"
              style={latoBody}
            >
              Descarga la app oficial para la mejor experiencia.{' '}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline underline decoration-white/50 underline-offset-2 hover:decoration-white"
                style={latoBody}
              >
                Descargar →
              </a>
            </span>
          </div>
        </div>
      </div>
    )
  }

  // 3. Web iOS y desktop: banner Beta + feedback (comportamiento original con renombre).
  const showStrip = storageReady && (thanksPhase || !sessionDismissed)

  const modal =
    modalOpen && portalEl
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal()
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-modal-title"
              className="relative w-full max-w-[480px] bg-white p-6 shadow-lg"
              style={{ borderRadius: 0 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={sending}
                className="absolute right-4 top-4 text-[#111111] opacity-60 hover:opacity-100 disabled:opacity-30"
                aria-label="Cerrar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <h2
                id="feedback-modal-title"
                className="pr-10 text-[20px] leading-tight text-[#111111]"
                style={jostHeading}
              >
                ENVÍA TU FEEDBACK
              </h2>
              <p
                className="mt-2 text-[13px] leading-relaxed text-[#666666]"
                style={latoBody}
              >
                ¿Qué funciona bien? ¿Qué mejorarías? Todo nos ayuda a crecer.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
                    style={jostHeading}
                    htmlFor="feedback-categoria"
                  >
                    ¿SOBRE QUÉ ES TU FEEDBACK?
                  </label>
                  <select
                    id="feedback-categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className={inputClass}
                    style={{ borderRadius: 2, ...latoBody }}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
                    style={jostHeading}
                    htmlFor="feedback-mensaje"
                  >
                    TU MENSAJE
                  </label>
                  <textarea
                    id="feedback-mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value.slice(0, 1000))}
                    rows={5}
                    maxLength={1000}
                    placeholder="Cuéntanos lo que piensas..."
                    className={`${inputClass} min-h-[120px]`}
                    style={{ borderRadius: 2, ...latoBody, resize: 'vertical' }}
                  />
                  <p
                    className="mt-1 text-right text-xs text-[#666666]"
                    style={latoBody}
                  >
                    {mensaje.length}/1000
                  </p>
                </div>
                <div>
                  <label
                    className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
                    style={jostHeading}
                    htmlFor="feedback-email"
                  >
                    EMAIL (OPCIONAL)
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com (opcional, si quieres respuesta)"
                    className={inputClass}
                    style={{ borderRadius: 2, ...latoBody }}
                    autoComplete="email"
                  />
                </div>
                {submitError ? (
                  <p className="text-sm text-[#CC4B37]" style={latoBody}>
                    {submitError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={!mensaje.trim() || sending}
                  className="w-full py-3 text-white transition-opacity disabled:opacity-40"
                  style={{
                    ...jostHeading,
                    backgroundColor: '#CC4B37',
                    borderRadius: 0,
                    fontSize: 14,
                  }}
                >
                  {sending ? 'ENVIANDO...' : 'ENVIAR'}
                </button>
              </form>
            </div>
          </div>,
          portalEl
        )
      : null

  return (
    <>
      {showStrip ? (
        <div
          className="relative z-[40] w-full px-4 py-3 text-white"
          style={{ backgroundColor: '#111111', padding: '12px 16px' }}
        >
          {!thanksPhase ? (
            <>
              <button
                type="button"
                onClick={dismissBetaBanner}
                className="absolute right-4 top-3 text-white opacity-60 hover:opacity-100"
                aria-label="Cerrar aviso"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6L18 18M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div className="pr-8">
                <div className="flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-x-2">
                  <span
                    className="block shrink-0 font-bold leading-snug"
                    style={latoBody}
                  >
                    AirNation está en Beta
                  </span>
                  <span
                    className="block text-sm leading-snug text-white/95 md:inline md:text-sm"
                    style={latoBody}
                  >
                    Estamos construyendo esto para la comunidad. Algunas funciones
                    están en desarrollo — tu opinión nos ayuda a mejorar.{' '}
                    <button
                      type="button"
                      onClick={openModal}
                      className="inline underline decoration-white/50 underline-offset-2 hover:decoration-white"
                      style={latoBody}
                    >
                      Enviar feedback →
                    </button>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p
              className="text-center text-sm font-medium text-white"
              style={latoBody}
            >
              ¡Gracias por tu feedback!
            </p>
          )}
        </div>
      ) : null}

      {modal}
    </>
  )
}
