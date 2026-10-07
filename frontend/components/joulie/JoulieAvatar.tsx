'use client'

import { useEffect, useRef } from 'react'
import './joulie-avatar.css'

export type JouliePhase = 'idle' | 'listening' | 'hearing' | 'thinking' | 'speaking'

export function JoulieAvatar({
  phase,
  level = 0,
  size = 72,
  label,
}: {
  phase: JouliePhase
  level?: number
  size?: number
  label: string
}) {
  const ball = useRef<HTMLSpanElement>(null)
  const clamped = Math.min(1, Math.max(0, level))

  useEffect(() => {
    const el = ball.current
    if (!el || phase !== 'speaking') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      el.style.setProperty('--joulie-wobble', '0')
    }
    const tick = (now: number) => {
      el.style.setProperty('--joulie-wobble', Math.sin(now / 70).toFixed(3))
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      stop()
      if (!media.matches) frame = requestAnimationFrame(tick)
    }
    sync()
    media.addEventListener('change', sync)
    return () => {
      media.removeEventListener('change', sync)
      stop()
    }
  }, [phase])

  return (
    <div
      className="joulie-bb"
      data-state={phase}
      style={{ width: size, height: size, ['--joulie-level' as string]: String(clamped) }}
      role="img"
      aria-label={label}
    >
      <span ref={ball} className="joulie-bb-ball" aria-hidden />
    </div>
  )
}
