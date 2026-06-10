'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
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
      return 'bg-[#666666]/15 text-[#999999] border-[#666666]/40'
    case 'finalizada':
      return 'bg-[#666666]/15 text-[#999999] border-[#666666]/40 line-through'
    default:
      return 'bg-[#666666]/15 text-[#999999]'
  }
}

export function InscripcionSection({ config }: { config: InscripcionConfig }) {
  const ventanas = config.ventanas ?? []
  const eyebrow = config.eyebrow?.trim() || 'INSCRIPCIÓN'
  const titulo = config.titulo?.trim() || 'VENTANAS DE PRECIO'

  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setShowLeft(el.scrollLeft > 8)
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

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
          {config.nota?.trim() ? (
            <p
              className="mx-auto mt-4 max-w-2xl text-sm text-[#666666] md:text-base"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              {config.nota}
            </p>
          ) : null}
        </motion.div>

        {ventanas.length === 0 ? (
          <p
            className="text-center text-sm text-[#666666]"
            style={{ fontFamily: 'Lato, sans-serif' }}
          >
            Ventanas de inscripción próximamente
          </p>
        ) : (
          <div className="relative">
            {/* Fade izquierdo */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-20 transition-opacity duration-300 md:w-32"
              style={{
                opacity: showLeft ? 1 : 0,
                background: 'linear-gradient(to right, #F5F3EF, transparent)',
              }}
            />
            {/* Fade derecho */}
            <div
              className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-20 transition-opacity duration-300 md:w-32"
              style={{
                opacity: showRight ? 1 : 0,
                background: 'linear-gradient(to left, #F5F3EF, transparent)',
              }}
            />
            {/* Scroll container */}
            <div
              ref={scrollRef}
              className="virus3-scroll flex gap-5 overflow-x-auto pb-4 md:gap-6"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`.virus3-scroll::-webkit-scrollbar { display: none; }`}</style>
              {ventanas.map((v, i) => (
                <div
                  key={`${v.nombre}-${i}`}
                  className="shrink-0"
                  style={{ width: 'clamp(280px, 80vw, 340px)', scrollSnapAlign: 'start' }}
                >
                  <VentanaCard ventana={v} index={i} />
                </div>
              ))}
            </div>
          </div>
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
        <h3
          className="text-lg leading-tight md:text-xl"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
        >
          {ventana.nombre?.trim() || 'Ventana'}
        </h3>
        <span
          className={`shrink-0 border px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.12em] ${estadoBadgeClass(ventana.estado)}`}
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
        >
          {ESTADO_LABELS[ventana.estado] ?? ventana.estado}
        </span>
      </div>

      {(ventana.fecha_inicio?.trim() || ventana.fecha_fin?.trim()) ? (
        <p
          className="mb-4 text-xs text-[#999999]"
          style={{ fontFamily: 'Lato, sans-serif' }}
        >
          {ventana.fecha_inicio?.trim()}
          {ventana.fecha_inicio?.trim() && ventana.fecha_fin?.trim() ? ' — ' : ''}
          {ventana.fecha_fin?.trim()}
        </p>
      ) : null}

      <p
        className="mb-5 text-3xl text-[#111111] md:text-4xl"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
      >
        {ventana.precio?.trim() || '—'}
      </p>

      {incluye.length > 0 ? (
        <ul className="mb-6 flex flex-1 flex-col gap-2">
          {incluye.map((item, j) => (
            <li
              key={j}
              className="flex items-start gap-2 text-sm text-[#444444]"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
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
