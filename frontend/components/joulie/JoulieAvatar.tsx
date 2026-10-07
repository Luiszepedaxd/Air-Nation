'use client'

import { useEffect, useState } from 'react'
import './joulie-avatar.css'

export type JouliePhase = 'idle' | 'listening' | 'hearing' | 'thinking' | 'speaking'

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])
  return reduced
}

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
  const reduced = useReducedMotion()
  const clamped = Math.min(1, Math.max(0, level))
  return (
    <div
      className="joulie-bb"
      data-state={reduced ? 'still' : phase}
      style={{ width: size, height: size, ['--joulie-level' as string]: String(clamped) }}
      role="img"
      aria-label={label}
    >
      <span className="joulie-bb-ball" aria-hidden />
    </div>
  )
}
