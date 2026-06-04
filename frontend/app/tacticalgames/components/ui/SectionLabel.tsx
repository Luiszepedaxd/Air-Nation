'use client'

import { motion } from 'framer-motion'
import { TG_COLORS, TG_FONTS } from './theme'

/**
 * Etiqueta táctica tipo "SECCIÓN 01 // BRIEFING" con línea horizontal
 * que se extiende hacia el borde derecho.
 */
export function SectionLabel({
  numero,
  nombre,
  color = TG_COLORS.olive,
  className = '',
}: {
  numero: string
  nombre: string
  color?: string
  className?: string
}) {
  const texto = `SECCIÓN ${numero} // ${nombre}`.toUpperCase()
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
        {texto}
      </span>
      <span className="h-px flex-1" style={{ backgroundColor: color, opacity: 0.5 }} />
    </motion.div>
  )
}
