'use client'

import { motion } from 'framer-motion'
import { TG_COLORS } from './theme'

/**
 * Contenedor tipo carpeta/expediente: borde manila, esquina superior
 * derecha "doblada" en CSS y sombra sutil.
 */
export function DossierCard({
  children,
  className = '',
  background = 'rgba(245,240,230,0.95)',
  foldColor = TG_COLORS.border,
  delay = 0,
  animate = true,
}: {
  children: React.ReactNode
  className?: string
  background?: string
  foldColor?: string
  delay?: number
  animate?: boolean
}) {
  const inner = (
    <>
      {/* Triángulo de página doblada (esquina superior derecha) */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0"
        style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 20px 20px 0',
          borderColor: `transparent ${foldColor} transparent transparent`,
        }}
      />
      {children}
    </>
  )

  const cls = `relative overflow-hidden p-6 md:p-8 ${className}`
  const style = {
    background,
    border: `1px solid ${TG_COLORS.border}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  }

  if (!animate) {
    return (
      <div className={cls} style={style}>
        {inner}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay }}
      className={cls}
      style={style}
    >
      {inner}
    </motion.div>
  )
}
