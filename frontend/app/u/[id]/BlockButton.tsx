'use client'

import { useState } from 'react'
import { clearFeedSessionCache } from '@/app/dashboard/FeedHome'
import { blockUser, unblockUser } from '@/lib/user-blocks'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function BlockButton({
  profileUserId,
  currentUserId,
  initialIsBlocked,
  profileAlias,
  onBlockedChange,
}: {
  profileUserId: string
  currentUserId: string
  initialIsBlocked: boolean
  profileAlias: string | null
  onBlockedChange?: (blocked: boolean) => void
}) {
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleBlock = async () => {
    setBusy(true)
    const result = await blockUser(currentUserId, profileUserId)
    setBusy(false)
    if (result.ok) {
      setIsBlocked(true)
      setConfirming(false)
      onBlockedChange?.(true)
      clearFeedSessionCache()
      // Recargar la página para que el server component aplique la pantalla bloqueada
      window.location.reload()
    }
  }

  const handleUnblock = async () => {
    setBusy(true)
    const result = await unblockUser(currentUserId, profileUserId)
    setBusy(false)
    if (result.ok) {
      setIsBlocked(false)
      setConfirming(false)
      onBlockedChange?.(false)
      clearFeedSessionCache()
      window.location.reload()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="ml-auto flex h-8 w-8 items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] transition-colors hover:border-[#CCCCCC]"
        aria-label={isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5.6 5.6l12.8 12.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 px-0 md:px-4"
          onClick={() => !busy && setConfirming(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-[12px] bg-white px-6 pt-6 pb-6 md:rounded-[8px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={jost} className="mb-3 text-[16px] font-extrabold uppercase text-[#111111]">
              {isBlocked ? 'Desbloquear' : 'Bloquear'} a {profileAlias || 'este jugador'}
            </h2>
            <p style={lato} className="mb-5 text-[13px] leading-relaxed text-[#666666]">
              {isBlocked
                ? 'Volverás a ver sus publicaciones y podrá interactuar contigo.'
                : 'No verás sus publicaciones. Tampoco podrá ver tu perfil ni tu contenido. Puedes desbloquearlo cuando quieras.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                style={jost}
                className="flex-1 border border-[#EEEEEE] bg-white px-3 py-2.5 text-[11px] font-extrabold uppercase text-[#666666] disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void (isBlocked ? handleUnblock() : handleBlock())}
                disabled={busy}
                style={jost}
                className="flex-1 bg-[#CC4B37] px-3 py-2.5 text-[11px] font-extrabold uppercase text-white disabled:opacity-40"
              >
                {busy ? 'Procesando…' : isBlocked ? 'Desbloquear' : 'Bloquear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
