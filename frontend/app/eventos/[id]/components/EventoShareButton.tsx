'use client'

import { useState } from 'react'
import { sharePost } from '@/lib/post-engagements'

export function EventoShareButton({
  eventId,
  title,
  text,
}: {
  eventId: string
  title: string
  text?: string
}) {
  const [copiado, setCopiado] = useState(false)

  const handleShare = async () => {
    if ((await sharePost(`/eventos/${eventId}`, title, text)) === 'copied') {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Compartir evento"
      className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#666666] transition-colors hover:text-[#CC4B37]"
      style={{ fontFamily: "'Jost', sans-serif" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M12 16V3m0 0L8 7m4-4l4 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {copiado ? 'Link copiado' : 'Compartir'}
    </button>
  )
}
