'use client'

import { motion } from 'framer-motion'
import { TG_COLORS, TG_FONTS } from './theme'

/**
 * Separador horizontal punteado con texto centrado opcional
 * tipo "--- CONTINÚA ---".
 */
export function DashedDivider({
  texto,
  color = TG_COLORS.border,
  textColor = TG_COLORS.olive,
  className = '',
}: {
  texto?: string
  color?: string
  textColor?: string
  className?: string
}) {
  if (!texto) {
    return (
      <div
        className={`w-full ${className}`}
        style={{ borderTop: `1px dashed ${color}` }}
        aria-hidden
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`flex items-center gap-4 ${className}`}
    >
      <span className="h-px flex-1" style={{ borderTop: `1px dashed ${color}` }} />
      <span
        className="shrink-0 text-[0.6rem] tracking-[0.3em] md:text-xs"
        style={{ fontFamily: TG_FONTS.mono, fontWeight: 400, color: textColor }}
      >
        {texto}
      </span>
      <span className="h-px flex-1" style={{ borderTop: `1px dashed ${color}` }} />
    </motion.div>
  )
}
