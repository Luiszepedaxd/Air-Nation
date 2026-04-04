'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { RSVPButton } from './RSVPButton'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

export function EventoCupoYRSVP({
  eventId,
  cupo,
  initialCount,
  initialHasRsvp,
  sessionUserId,
  children,
}: {
  eventId: string
  cupo: number
  initialCount: number
  initialHasRsvp: boolean
  sessionUserId: string | null
  children: ReactNode
}) {
  const [displayCount, setDisplayCount] = useState(initialCount)

  useEffect(() => {
    setDisplayCount(initialCount)
  }, [initialCount])

  const onCountChange = useCallback((delta: number) => {
    setDisplayCount((c) => Math.max(0, c + delta))
  }, [])

  const pct =
    cupo > 0 ? Math.min(100, Math.round((displayCount / cupo) * 100)) : 0

  return (
    <div className="space-y-8">
      <section>
        <h2
          style={jost}
          className="text-[11px] font-extrabold uppercase tracking-widest text-[#999999]"
        >
          CUPO
        </h2>
        {cupo <= 0 ? (
          <p className="mt-3 text-[14px] text-[#111111]" style={lato}>
            Sin límite de cupo · {displayCount} confirmados
          </p>
        ) : (
          <>
            <p className="mt-3 text-[14px] text-[#111111]" style={lato}>
              <span className="font-semibold">{displayCount}</span> confirmados /{' '}
              <span className="font-semibold">{cupo}</span> lugares
            </p>
            <div className="mt-2 h-2 w-full bg-[#EEEEEE]">
              <div
                className="h-full bg-[#CC4B37] transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </section>

      {children}

      <RSVPButton
        eventId={eventId}
        cupo={cupo}
        initialCount={initialCount}
        initialHasRsvp={initialHasRsvp}
        sessionUserId={sessionUserId}
        onCountChange={onCountChange}
      />
    </div>
  )
}
