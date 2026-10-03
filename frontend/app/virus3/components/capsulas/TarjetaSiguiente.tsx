'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
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
  onPreload,
  layoutId,
}: {
  capsula: CapsulaItem
  progreso: CapsulasProgress
  todasHechas: boolean
  pulsar: boolean
  onAbrir: (rect: DOMRect) => void
  onPreload?: () => void
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
      data-capsula-thumb={capsula.id}
      className={`relative w-full max-w-[420px] overflow-hidden text-left lg:max-w-none ${FOCUS}`}
      onPointerDown={() => onPreload?.()}
      onClick={(e) => onAbrir(e.currentTarget.getBoundingClientRect())}
      animate={pulsar && !quieto ? { scale: [1, 1.02, 1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 1.2 }}
    >
      <div className="relative h-[clamp(240px,48svh,420px)] w-full overflow-hidden bg-black sm:h-[clamp(260px,50svh,420px)] lg:aspect-[4/5] lg:h-auto">
        <motion.div
          className="absolute inset-0"
          animate={quieto ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'linear' }}
        >
          <PosterVisual capsula={capsula} width={420} height={525} imgClassName="h-full w-full object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 pb-3.5 lg:p-4 lg:pb-5">
          <p
            className="mb-1 flex items-center gap-2 text-[9px] tracking-[0.18em] text-white/70 lg:mb-2 lg:text-[10px] lg:tracking-[0.2em]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
          >
            {!todasHechas && !quieto ? (
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#CC4B37] lg:h-2 lg:w-2" aria-hidden />
            ) : null}
            {label}
          </p>
          <p
            className="text-4xl leading-none lg:text-5xl"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, color }}
          >
            {capsula.numero}
          </p>
          <p
            className="mt-1 line-clamp-1 text-base uppercase leading-tight lg:mt-2 lg:text-lg"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
          >
            {capsula.titulo}
          </p>
          <p className="mt-0.5 text-[11px] text-white/55 lg:mt-1 lg:text-xs" style={{ fontFamily: 'Lato, sans-serif' }}>
            {duracion ? `${duracion} · ${estado}` : estado}
          </p>
        </div>
        <span
          className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center text-white lg:bottom-4 lg:right-4 lg:h-16 lg:w-16"
          style={{ background: color }}
          aria-hidden
        >
          <Play className="h-6 w-6 lg:h-8 lg:w-8" fill="currentColor" aria-hidden />
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
