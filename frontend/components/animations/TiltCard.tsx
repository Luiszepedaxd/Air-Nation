'use client'

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import type { MouseEvent, ReactNode } from 'react'
import { useRef } from 'react'

type Props = {
  children: ReactNode
  /** Intensidad del tilt en grados (default 8) */
  intensity?: number
  /** Si el efecto holográfico está activo (default false) */
  holographic?: boolean
  /** className para el wrapper */
  className?: string
}

export function TiltCard({
  children,
  intensity = 8,
  holographic = false,
  className = '',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseX = useSpring(x, { stiffness: 200, damping: 20 })
  const mouseY = useSpring(y, { stiffness: 200, damping: 20 })

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity])

  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%'])

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (reducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    x.set(px - 0.5)
    y.set(py - 0.5)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`relative ${className}`}
    >
      {children}
      {holographic ? (
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            background: `radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.4) 0%, rgba(204,75,55,0.2) 30%, transparent 60%)`,
            ['--gx' as string]: glareX,
            ['--gy' as string]: glareY,
          }}
          aria-hidden
        />
      ) : null}
    </motion.div>
  )
}
