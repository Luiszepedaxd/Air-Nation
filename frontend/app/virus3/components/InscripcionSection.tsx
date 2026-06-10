'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { InscripcionConfig, VentanaInscripcion } from '../lib/types'

const ESTADO_LABELS: Record<VentanaInscripcion['estado'], string> = {
  activa: 'Activa',
  agotada: 'Agotada',
  proxima: 'Próxima',
  finalizada: 'Finalizada',
}

function estadoBadgeClass(estado: VentanaInscripcion['estado']) {
  switch (estado) {
    case 'activa':
      return 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/40'
    case 'agotada':
      return 'bg-[#CC4B37]/15 text-[#CC4B37] border-[#CC4B37]/40'
    case 'proxima':
      return 'bg-[#666]/15 text-[#999] border-[#666]/40'
    case 'finalizada':
      return 'bg-[#666]/15 text-[#999] border-[#666]/40 line-through'
    default:
      return 'bg-[#666]/15 text-[#999]'
  }
}

export function InscripcionSection({ config }: { config: InscripcionConfig }) {
  const ventanas = config.ventanas ?? []
  const eyebrow = config.eyebrow?.trim() || 'INSCRIPCIÓN'
  const titulo = config.titulo?.trim() || 'VENTANAS DE PRECIO'
  const [active, setActive] = useState(0)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const SWIPE_THRESHOLD = 40

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX
    const delta = touchStartX.current - touchEndX.current
    const total = ventanas.length
    if (delta > SWIPE_THRESHOLD) {
      setActive((prev) => Math.min(prev + 1, total - 1))
    } else if (delta < -SWIPE_THRESHOLD) {
      setActive((prev) => Math.max(prev - 1, 0))
    }
  }

  return (
    <section
      id="inscripcion"
      data-section="inscripcion"
      className="relative w-full bg-[#F5F3EF] py-16 text-[#111111] md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center md:mb-14"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-3 text-3xl leading-none md:text-5xl"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
          >
            {titulo}
          </h2>
          {config.nota?.trim() && (
            <p
              className="mx-auto mt-4 max-w-2xl text-sm text-[#666666] md:text-base"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              {config.nota}
            </p>
          )}
        </motion.div>

        {ventanas.length === 0 ? (
          <p className="text-center text-sm text-[#666666]" style={{ fontFamily: 'Lato, sans-serif' }}>
            Ventanas de inscripción próximamente
          </p>
        ) : (
          <>
            {/* Desktop: todas visibles en grid */}
            <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
              {ventanas.map((v, i) => (
                <VentanaCard key={`${v.nombre}-${i}`} ventana={v} index={i} />
              ))}
            </div>

            {/* Mobile: una a la vez */}
            <div className="md:hidden">
              <div
                className="relative overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.28 }}
                  >
                    <VentanaCard ventana={ventanas[active]} index={active} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dots */}
              <div className="mt-6 flex items-center justify-center gap-2">
                {ventanas.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Ventana ${i + 1}`}
                    className="transition-all duration-200"
                    style={{
                      width: i === active ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === active ? '#CC4B37' : 'rgba(0,0,0,0.2)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function VentanaCard({ ventana, index }: { ventana: VentanaInscripcion; index: number }) {
  const activa = ventana.estado === 'activa'
  const incluye = (ventana.incluye ?? []).filter((s) => typeof s === 'string' && s.trim())

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
        <span
          className={`shrink-0 border px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.12em] ${estadoBadgeClass(ventana.estado)}`}
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
        >
          {ESTADO_LABELS[ventana.estado] ?? ventana.estado}
        </span>
      </div>

      {(ventana.fecha_inicio?.trim() || ventana.fecha_fin?.trim()) && (
        <p className="mb-4 text-xs text-[#999999]" style={{ fontFamily: 'Lato, sans-serif' }}>
          {ventana.fecha_inicio?.trim()}
          {ventana.fecha_inicio?.trim() && ventana.fecha_fin?.trim() ? ' — ' : ''}
          {ventana.fecha_fin?.trim()}
        </p>
      )}

      <p className="mb-5 text-3xl text-[#111111] md:text-4xl" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}>
        {ventana.precio?.trim() || '—'}
      </p>

      {incluye.length > 0 ? (
        <ul className="mb-6 flex flex-1 flex-col gap-2">
          {incluye.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-[#444444]" style={{ fontFamily: 'Lato, sans-serif' }}>
              <span className="mt-0.5 shrink-0 text-[#CC4B37]" aria-hidden>
                ✓
              </span>
              {item.trim()}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1" />
      )}

      {ventana.cta_link?.trim() ? (
        activa ? (
          <a
            href={ventana.cta_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#CC4B37] px-5 py-3 text-[0.65rem] uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
          >
            {ventana.cta_texto?.trim() || 'Inscribirme'}
          </a>
        ) : (
          <span
            className="inline-flex cursor-not-allowed items-center justify-center bg-[#CCCCCC] px-5 py-3 text-[0.65rem] uppercase tracking-[0.15em] text-[#888888]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
          >
            {ventana.cta_texto?.trim() || 'No disponible'}
          </span>
        )
      ) : null}
    </motion.div>
  )
}
