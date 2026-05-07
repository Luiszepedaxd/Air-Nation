'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Delay en segundos antes de la animación (default 0) */
  delay?: number
  /** Distancia en px de translate inicial (default 30) */
  distance?: number
  /** Duración en segundos (default 0.6) */
  duration?: number
  /** Dirección del slide: 'up' | 'down' | 'left' | 'right' | 'fade' (default 'up') */
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  /** Si la animación se dispara solo una vez (default true) */
  once?: boolean
  /** Margin del viewport para trigger (default '-50px') */
  margin?: string
  /** className para el wrapper */
  className?: string
}

export function RevealOnScroll({
  children,
  delay = 0,
  distance = 30,
  duration = 0.6,
  direction = 'up',
  once = true,
  margin = '-50px',
  className = '',
}: Props) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  const initialOffset = (() => {
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 }
      case 'down':
        return { y: -distance, x: 0 }
      case 'left':
        return { x: distance, y: 0 }
      case 'right':
        return { x: -distance, y: 0 }
      case 'fade':
        return { x: 0, y: 0 }
    }
  })()

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...initialOffset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
