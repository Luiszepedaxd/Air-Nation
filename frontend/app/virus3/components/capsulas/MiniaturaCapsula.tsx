'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import type { CapsulaItem } from '../../lib/types'
import { isCompleted, type CapsulasProgress } from '../../lib/progreso-capsulas'
import { FOCUS, acento } from './helpers'
import { PosterVisual } from './PosterVisual'

function MiniaturaCapsulaInner({
  capsula,
  progreso,
  destacada,
  onElegir,
  layoutId,
}: {
  capsula: CapsulaItem
  progreso: CapsulasProgress
  destacada: boolean
  onElegir: (rect: DOMRect) => void
  layoutId?: string
}) {
  const color = acento(capsula.color)
  const completa = isCompleted(progreso, capsula.id)
  const pos = progreso.p[capsula.id] ?? 0
  const enProgreso = !completa && pos > 0
  const pct = capsula.duracion_seg > 0 ? Math.min(100, Math.round((pos / capsula.duracion_seg) * 100)) : null

  return (
    <li className="shrink-0 snap-start">
      <button
        type="button"
        onClick={(e) => onElegir(e.currentTarget.getBoundingClientRect())}
        className={`w-[104px] text-left md:w-[140px] ${FOCUS}`}
        aria-current={destacada ? 'true' : undefined}
        aria-label={`Cápsula ${capsula.numero}: ${capsula.titulo}`}
      >
        <motion.div
          layoutId={layoutId}
          data-capsula-thumb={capsula.id}
          className={`relative aspect-[9/16] w-[104px] overflow-hidden bg-[#1a1a1a] md:w-[140px] ${
            destacada ? 'outline outline-2 outline-offset-0' : ''
          }`}
          style={{ outlineColor: destacada ? color : undefined, scale: destacada ? 1.04 : 1 }}
        >
          <PosterVisual capsula={capsula} width={140} height={249} />
          <span
            className="absolute left-1 top-1 px-1 text-[10px]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, color, background: 'rgba(0,0,0,0.55)' }}
          >
            {capsula.numero}
          </span>
          {completa ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg text-white" aria-hidden>
              ✓
            </span>
          ) : null}
          {enProgreso && pct != null ? (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20" aria-hidden>
              <span className="block h-full" style={{ width: `${pct}%`, background: color }} />
            </span>
          ) : null}
        </motion.div>
        <p
          className="mt-1.5 line-clamp-2 text-[11px] uppercase leading-snug text-white/80"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
        >
          {capsula.titulo}
        </p>
      </button>
    </li>
  )
}

export const MiniaturaCapsula = memo(MiniaturaCapsulaInner)
