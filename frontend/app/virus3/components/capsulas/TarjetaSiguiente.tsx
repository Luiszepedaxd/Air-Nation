'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import type { CapsulaItem } from '../../lib/types'
import { isCompleted, type CapsulasProgress } from '../../lib/progreso-capsulas'
import { FOCUS, acento, formatearDuracion, prefiereQuieto } from './helpers'
import { PosterVisual } from './PosterVisual'

function TarjetaSiguienteInner({
  capsula,
  progreso,
  todasHechas,
  pulsar,
  onAbrir,
  layoutId,
}: {
  capsula: CapsulaItem
  progreso: CapsulasProgress
  todasHechas: boolean
  pulsar: boolean
  onAbrir: (rect: DOMRect) => void
  layoutId?: string
}) {
  const color = acento(capsula.color)
  const completa = isCompleted(progreso, capsula.id)
  const pos = progreso.p[capsula.id] ?? 0
  const enProgreso = !completa && pos > 0
  const pct = capsula.duracion_seg > 0 ? Math.min(100, Math.round((pos / capsula.duracion_seg) * 100)) : null
  const duracion = capsula.duracion_seg > 0 ? formatearDuracion(capsula.duracion_seg) : ''
  const estado = completa ? 'Completa' : enProgreso ? 'En progreso' : 'Nueva'
  const label = todasHechas ? 'VOLVER A VER' : enProgreso ? 'CONTINUAR' : 'SIGUIENTE TRANSMISIÓN'
  const quieto = prefiereQuieto()

  return (
    <motion.button
      type="button"
      layoutId={layoutId}
      className={`relative w-full max-w-[420px] overflow-hidden text-left lg:max-w-none ${FOCUS}`}
      onClick={(e) => onAbrir(e.currentTarget.getBoundingClientRect())}
      animate={pulsar && !quieto ? { scale: [1, 1.02, 1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 1.2 }}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
        <motion.div
          className="absolute inset-0"
          animate={quieto ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'linear' }}
        >
          <PosterVisual capsula={capsula} width={420} height={525} imgClassName="h-full w-full object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 pb-5">
          <p
            className="mb-2 flex items-center gap-2 text-[10px] tracking-[0.2em] text-white/70"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
          >
            {!todasHechas && !quieto ? (
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#CC4B37]" aria-hidden />
            ) : null}
            {label}
          </p>
          <p className="text-5xl leading-none" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, color }}>
            {capsula.numero}
          </p>
          <p
            className="mt-2 text-lg uppercase leading-tight"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
          >
            {capsula.titulo}
          </p>
          <p className="mt-1 text-xs text-white/55" style={{ fontFamily: 'Lato, sans-serif' }}>
            {duracion ? `${duracion} · ${estado}` : estado}
          </p>
        </div>
        <span
          className="absolute bottom-4 right-4 flex h-16 w-16 items-center justify-center text-2xl text-white"
          style={{ background: color, fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
          aria-hidden
        >
          ▶
        </span>
        {enProgreso && pct != null ? (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-white/15" aria-hidden>
            <span className="block h-full" style={{ width: `${pct}%`, background: color }} />
          </span>
        ) : null}
      </div>
    </motion.button>
  )
}

export const TarjetaSiguiente = memo(TarjetaSiguienteInner)
