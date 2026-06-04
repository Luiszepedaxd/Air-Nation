'use client'

import { motion } from 'framer-motion'
import { TG_COLORS, TG_FONTS } from './theme'

/**
 * Etiqueta táctica (eyebrow) en JetBrains Mono con línea horizontal que se
 * extiende hacia el borde derecho. Renderiza exactamente el texto recibido,
 * sin prefijos automáticos.
 */
export function SectionLabel({
  text,
  color = TG_COLORS.olive,
  className = '',
}: {
  text: string
  color?: string
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`flex items-center gap-4 ${className}`}
    >
      <span
        className="shrink-0 text-[0.6rem] tracking-[0.35em] md:text-xs"
        style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color }}
      >
        {(text || '').toUpperCase()}
      </span>
      <span className="h-px flex-1" style={{ backgroundColor: color, opacity: 0.5 }} />
    </motion.div>
  )
}
