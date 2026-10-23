'use client'

import { useRef, useState, type TouchEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { InscripcionConfig, VentanaInscripcion } from '../lib/types'
import { formatoFechaCancun } from '../lib/fechas'
import { propsEnlace } from '../lib/enlaces'

const ESTADOS = ['activa', 'agotada', 'proxima', 'finalizada'] as const

const ESTADO_LABELS: Record<VentanaInscripcion['estado'], string> = {
  activa: 'Activa',
  agotada: 'Agotada',
  proxima: 'Próxima',
  finalizada: 'Finalizada',
}

function estadoDe(v: unknown): VentanaInscripcion['estado'] {
  return ESTADOS.includes(v as VentanaInscripcion['estado']) ? (v as VentanaInscripcion['estado']) : 'proxima'
}

function estadoBadgeClass(estado: VentanaInscripcion['estado']) {
  switch (estado) {
    case 'activa':
      return 'bg-[#22C55E]/15 text-[#166534] border-[#22C55E]/40'
    case 'agotada':
      return 'bg-[#CC4B37]/15 text-[#CC4B37] border-[#CC4B37]/40'
    default:
      return 'bg-[#666]/10 text-[#666] border-[#666]/30'
  }
}

function lineaFechas(inicio: string, fin: string): string {
  const a = formatoFechaCancun(inicio)
  const b = formatoFechaCancun(fin)
  if (a && b) return `${a} — ${b}`
  return a || b
}

export function InscripcionSection({ config }: { config: InscripcionConfig }) {
  const ventanas = (config.ventanas ?? []).filter((v) => v && typeof v === 'object')
  const [active, setActive] = useState(0)
  const touchStartX = useRef(0)
  if (ventanas.length === 0) return null

  const eyebrow = config.eyebrow?.trim() || 'INSCRIPCIÓN'
  const titulo = config.titulo?.trim() || 'VENTANAS DE PRECIO'

  function handleTouchEnd(e: TouchEvent) {
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 40) setActive((prev) => Math.min(prev + 1, ventanas.length - 1))
    else if (delta < -40) setActive((prev) => Math.max(prev - 1, 0))
  }

  return (
    <section id="inscripcion" data-section="inscripcion" className="relative w-full overflow-hidden bg-[#F5F3EF] py-16 text-[#111111] md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center md:mb-14">
          <p className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}>
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl leading-none md:text-5xl" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}>
            {titulo}
          </h2>
          {config.nota?.trim() ? (
            <p className="mx-auto mt-4 max-w-2xl text-sm text-[#666666] md:text-base" style={{ fontFamily: 'Lato, sans-serif' }}>
              {config.nota}
            </p>
          ) : null}
        </motion.div>

        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
          {ventanas.map((v, i) => (
            <VentanaCard key={`${v.nombre}-${i}`} ventana={v} index={i} />
          ))}
        </div>

        <div className="md:hidden">
          <div className="relative overflow-hidden" onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }} onTouchEnd={handleTouchEnd}>
            <AnimatePresence mode="wait">
              <motion.div key={active} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }}>
                <VentanaCard ventana={ventanas[active]} index={active} />
              </motion.div>
            </AnimatePresence>
          </div>
          {ventanas.length > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              {ventanas.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Ventana ${i + 1}`}
                  className="h-2 border-0 p-0"
                  style={{ width: i === active ? 20 : 8, borderRadius: 4, background: i === active ? '#CC4B37' : 'rgba(0,0,0,0.2)' }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function VentanaCard({ ventana, index }: { ventana: VentanaInscripcion; index: number }) {
  const estado = estadoDe(ventana.estado)
  const activa = estado === 'activa'
  const incluye = (ventana.incluye ?? []).filter((s) => typeof s === 'string' && s.trim())
  const fechas = lineaFechas(ventana.fecha_inicio || '', ventana.fecha_fin || '')
  const link = ventana.cta_link?.trim() || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="flex h-full flex-col border border-[#E5E0DA] bg-white p-6"
      style={{ borderRadius: 2 }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-lg leading-tight md:text-xl" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}>
          {ventana.nombre?.trim() || 'Ventana'}
        </h3>
        <span className={`shrink-0 border px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.12em] ${estadoBadgeClass(estado)} ${estado === 'finalizada' ? 'line-through' : ''}`} style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}>
          {ESTADO_LABELS[estado]}
        </span>
      </div>

      {fechas ? (
        <p className="mb-4 text-xs text-[#999999]" style={{ fontFamily: 'Lato, sans-serif' }}>{fechas}</p>
      ) : null}

      <p className="mb-5 text-3xl text-[#111111] md:text-4xl" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}>
        {ventana.precio?.trim() || 'PRECIO POR CONFIRMAR'}
      </p>

      {incluye.length > 0 ? (
        <ul className="mb-6 flex flex-1 flex-col gap-2">
          {incluye.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-[#444444]" style={{ fontFamily: 'Lato, sans-serif' }}>
              <span className="mt-0.5 shrink-0 text-[#CC4B37]" aria-hidden>✓</span>
              {item.trim()}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1" />
      )}

      {link ? (
        activa ? (
          <a href={link} {...propsEnlace(link)} className="inline-flex items-center justify-center bg-[#CC4B37] px-5 py-3 text-[0.65rem] uppercase tracking-[0.15em] text-white hover:opacity-90" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}>
            {ventana.cta_texto?.trim() || 'Inscribirme'}
          </a>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center justify-center bg-[#CCCCCC] px-5 py-3 text-[0.65rem] uppercase tracking-[0.15em] text-[#888888]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}>
            {ventana.cta_texto?.trim() || 'No disponible'}
          </span>
        )
      ) : null}
    </motion.div>
  )
}
