'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { GuestActionModal } from '@/components/ui/GuestActionModal'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <svg
      className={`h-5 w-5 animate-spin ${dark ? 'text-[#666666]' : 'text-[#FFFFFF]'}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export function RSVPButton({
  eventId,
  cupo,
  initialCount,
  initialHasRsvp,
  sessionUserId,
  onCountChange,
}: {
  eventId: string
  cupo: number
  initialCount: number
  initialHasRsvp: boolean
  sessionUserId: string | null
  onCountChange?: (delta: number) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [localCount, setLocalCount] = useState(initialCount)
  const [hasRsvp, setHasRsvp] = useState(initialHasRsvp)
  const [guestModal, setGuestModal] = useState(false)

  useEffect(() => {
    setLocalCount(initialCount)
    setHasRsvp(initialHasRsvp)
  }, [initialCount, initialHasRsvp])

  const eventoLleno = useMemo(() => {
    if (cupo <= 0) return false
    if (hasRsvp) return false
    return localCount >= cupo
  }, [cupo, localCount, hasRsvp])

  const handleRsvp = useCallback(async () => {
    if (!sessionUserId || loading || eventoLleno) return
    setLoading(true)
    const { error } = await supabase.from('event_rsvps').insert({
      event_id: eventId,
      user_id: sessionUserId,
    })
    setLoading(false)
    if (error) {
      console.error('[rsvp]', error.message)
      return
    }
    setHasRsvp(true)
    setLocalCount((prev) => prev + 1)
    onCountChange?.(1)
    router.refresh()
  }, [sessionUserId, loading, eventoLleno, eventId, router, onCountChange])

  const handleCancel = useCallback(async () => {
    if (!sessionUserId || loading) return
    setLoading(true)
    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', sessionUserId)
    setLoading(false)
    if (error) {
      console.error('[rsvp cancel]', error.message)
      return
    }
    setHasRsvp(false)
    setLocalCount((prev) => Math.max(0, prev - 1))
    onCountChange?.(-1)
    router.refresh()
  }, [sessionUserId, loading, eventId, router, onCountChange])

  if (!sessionUserId) {
    return (
      <>
        <button
          type="button"
          style={jost}
          onClick={() => setGuestModal(true)}
          className="flex h-12 w-full items-center justify-center bg-[#CC4B37] text-[11px] tracking-wide text-[#FFFFFF]"
        >
          ME APUNTO
        </button>
        <GuestActionModal
          open={guestModal}
          onClose={() => setGuestModal(false)}
          action="rsvp"
          redirectPath={`/eventos/${eventId}`}
        />
      </>
    )
  }

  if (eventoLleno) {
    return (
      <button
        type="button"
        disabled
        style={jost}
        className="flex h-12 w-full cursor-not-allowed items-center justify-center bg-[#F4F4F4] text-[11px] tracking-wide text-[#999999]"
      >
        EVENTO LLENO
      </button>
    )
  }

  if (hasRsvp) {
    return (
      <button
        type="button"
        disabled={loading}
        style={jost}
        onClick={() => void handleCancel()}
        className="flex h-12 w-full items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[11px] tracking-wide text-[#666666]"
      >
        {loading ? <Spinner dark /> : 'YA NO VOY'}
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={loading}
      style={jost}
      onClick={() => void handleRsvp()}
      className="flex h-12 w-full items-center justify-center bg-[#CC4B37] text-[11px] tracking-wide text-[#FFFFFF] disabled:opacity-70"
    >
      {loading ? <Spinner /> : 'ME APUNTO'}
    </button>
  )
}
