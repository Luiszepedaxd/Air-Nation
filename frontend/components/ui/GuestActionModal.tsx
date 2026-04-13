'use client'

import Link from 'next/link'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type Props = {
  open: boolean
  onClose: () => void
  action?: 'rsvp' | 'solicitar' | 'resena' | 'default'
  redirectPath?: string
}

const COPY: Record<
  NonNullable<Props['action']>,
  { titulo: string; sub: string; cta: string }
> = {
  rsvp: {
    titulo: 'Apúntate al evento',
    sub: 'Crea tu cuenta gratis para confirmar asistencia y no perderte ningún juego.',
    cta: 'Crear cuenta gratis',
  },
  solicitar: {
    titulo: 'Solicita el campo',
    sub: 'Regístrate para enviar tu solicitud y coordinar partidas con el operador.',
    cta: 'Crear cuenta gratis',
  },
  resena: {
    titulo: 'Deja tu reseña',
    sub: 'Crea tu cuenta gratis para calificar campos y ayudar a la comunidad.',
    cta: 'Crear cuenta gratis',
  },
  default: {
    titulo: 'Únete a AirNation',
    sub: 'Crea tu cuenta gratis para acceder a todas las funciones de la plataforma.',
    cta: 'Crear cuenta gratis',
  },
}

export function GuestActionModal({ open, onClose, action = 'default', redirectPath }: Props) {
  if (!open) return null

  const copy = COPY[action]
  const registerHref = redirectPath
    ? `/register?redirect=${encodeURIComponent(redirectPath)}`
    : '/register'
  const loginHref = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : '/login'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm bg-white border border-[#EEEEEE]"
        style={{ borderRadius: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[#EEEEEE] px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2
              className="text-[16px] text-[#111111] leading-tight tracking-[0.08em]"
              style={jost}
            >
              {copy.titulo}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#666666]" style={lato}>
              {copy.sub}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-[#999999] hover:text-[#111111] transition-colors mt-0.5"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* CTAs */}
        <div className="px-5 py-5 flex flex-col gap-3">
          <Link
            href={registerHref}
            className="flex h-12 w-full items-center justify-center bg-[#CC4B37] text-[11px] tracking-[0.14em] text-white"
            style={jost}
          >
            {copy.cta}
            <svg className="ml-2" width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href={loginHref}
            className="flex h-12 w-full items-center justify-center border border-[#EEEEEE] text-[11px] tracking-[0.14em] text-[#333333] hover:border-[#CCCCCC] transition-colors"
            style={jost}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}
