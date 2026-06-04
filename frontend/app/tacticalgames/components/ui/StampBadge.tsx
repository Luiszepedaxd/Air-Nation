'use client'

import { motion } from 'framer-motion'
import { TG_COLORS, TG_FONTS } from './theme'

/**
 * Sello/stamp rotado tipo expediente clasificado.
 * Usado para marcar "OBLIGATORIO", "PREVENTA", "APROBADO", etc.
 */
export function StampBadge({
  children,
  color = TG_COLORS.red,
  rotate = -6,
  shape = 'rect',
  className = '',
  animate = true,
}: {
  children: React.ReactNode
  color?: string
  rotate?: number
  shape?: 'rect' | 'circle'
  className?: string
  animate?: boolean
}) {
  const base = (
    <span
      className={`inline-flex items-center justify-center border-2 px-3 py-1.5 text-center uppercase ${
        shape === 'circle' ? 'rounded-full' : ''
      } ${className}`}
      style={{
        borderColor: color,
        color,
        opacity: 0.85,
        fontFamily: TG_FONTS.mono,
        fontWeight: 700,
        letterSpacing: '0.18em',
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </span>
  )

  if (!animate) return base

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7, rotate: rotate - 8 }}
      whileInView={{ opacity: 0.85, scale: 1, rotate }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      className={`inline-flex items-center justify-center border-2 px-3 py-1.5 text-center text-[0.6rem] uppercase md:text-xs ${
        shape === 'circle' ? 'rounded-full' : ''
      } ${className}`}
      style={{
        borderColor: color,
        color,
        fontFamily: TG_FONTS.mono,
        fontWeight: 700,
        letterSpacing: '0.18em',
      }}
    >
      {children}
    </motion.span>
  )
}
