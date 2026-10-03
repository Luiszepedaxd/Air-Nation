'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import type { CapsulaItem } from '../../lib/types'
import { isCompleted, type CapsulasProgress } from '../../lib/progreso-capsulas'
import { acento, prefiereQuieto } from './helpers'

function ProgresoSegmentadoInner({
  lista,
  progreso,
  nota,
  todasHechas,
  porcentaje,
}: {
  lista: CapsulaItem[]
  progreso: CapsulasProgress
  nota: string
  todasHechas: boolean
  porcentaje: number
}) {
  const hechas = lista.filter((c) => isCompleted(progreso, c.id)).length
  const quieto = prefiereQuieto()

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="mb-2 flex items-center justify-between gap-3 text-[0.65rem] tracking-[0.22em]"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
      >
        <span>{hechas}/{lista.length} TRANSMISIONES</span>
        <span className="shrink-0" style={todasHechas ? { color: '#CC4B37' } : undefined}>
          {todasHechas ? 'MANUAL COMPLETO ✓' : `${porcentaje}%`}
        </span>
      </div>
      <div className="flex gap-0.5" aria-hidden>
        {lista.map((c, i) => {
          const completa = isCompleted(progreso, c.id)
          const pos = progreso.p[c.id] ?? 0
          const pct =
            !completa && c.duracion_seg > 0
              ? Math.min(100, Math.round((pos / c.duracion_seg) * 100))
              : completa
                ? 100
                : 0
          const color = acento(c.color)
          return (
            <motion.div
              key={c.id}
              className="relative h-[4px] flex-1 overflow-hidden bg-white/10"
              initial={quieto ? false : { opacity: 0, scaleY: 0 }}
              whileInView={quieto ? undefined : { opacity: 1, scaleY: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.35, delay: i * 0.02 }}
            >
              <div className="h-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
            </motion.div>
          )
        })}
      </div>
      {nota ? (
        <p className="mt-2 truncate text-[11px] text-white/45" style={{ fontFamily: 'Lato, sans-serif' }}>
          {nota}
        </p>
      ) : null}
    </div>
  )
}

export const ProgresoSegmentado = memo(ProgresoSegmentadoInner)
