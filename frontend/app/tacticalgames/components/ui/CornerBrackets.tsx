'use client'

import { TG_COLORS } from './theme'

/**
 * Marcas de esquina tipo HUD/target en las 4 esquinas de un contenedor.
 * Renderiza pseudo-corchetes con bordes parciales.
 */
export function CornerBrackets({
  children,
  color = TG_COLORS.red,
  size = 16,
  thickness = 2,
  className = '',
}: {
  children: React.ReactNode
  color?: string
  size?: number
  thickness?: number
  className?: string
}) {
  const common = 'pointer-events-none absolute'
  const s = `${size}px`
  const t = `${thickness}px`

  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden
        className={`${common} left-0 top-0`}
        style={{ width: s, height: s, borderLeft: `${t} solid ${color}`, borderTop: `${t} solid ${color}` }}
      />
      <span
        aria-hidden
        className={`${common} right-0 top-0`}
        style={{ width: s, height: s, borderRight: `${t} solid ${color}`, borderTop: `${t} solid ${color}` }}
      />
      <span
        aria-hidden
        className={`${common} bottom-0 left-0`}
        style={{ width: s, height: s, borderLeft: `${t} solid ${color}`, borderBottom: `${t} solid ${color}` }}
      />
      <span
        aria-hidden
        className={`${common} bottom-0 right-0`}
        style={{ width: s, height: s, borderRight: `${t} solid ${color}`, borderBottom: `${t} solid ${color}` }}
      />
      {children}
    </div>
  )
}
