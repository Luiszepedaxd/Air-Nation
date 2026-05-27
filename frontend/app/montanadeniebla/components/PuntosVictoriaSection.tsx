'use client'

import { motion } from 'framer-motion'
import type { PuntosVictoriaConfig, CriterioPunto } from '../lib/types'

function normalizeCriterios(raw: unknown): CriterioPunto[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return null
      const o = row as Record<string, unknown>
      const tipo = o.tipo === 'resta' ? 'resta' : o.tipo === 'suma' ? 'suma' : null
      const texto = typeof o.texto === 'string' ? o.texto.trim() : ''
      if (!tipo || !texto) return null
      return { tipo, texto }
    })
    .filter((c): c is CriterioPunto => c !== null)
}

function CriterioList({
  items,
  variant,
}: {
  items: CriterioPunto[]
  variant: 'suma' | 'resta'
}) {
  const headerColor = variant === 'suma' ? '#3AA76D' : '#CC4B37'
  const icon = variant === 'suma' ? '+' : '−'
  const label = variant === 'suma' ? 'SUMAN' : 'RESTAN'

  return (
    <div className="flex flex-col">
      <p
        className="mb-6 text-center text-[0.7rem] tracking-[0.4em] md:text-left"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, color: headerColor }}
      >
        {icon} {label}
      </p>
      {items.length === 0 ? (
        <p
          className="text-sm text-white/50"
          style={{ fontFamily: 'Lato, sans-serif' }}
        >
          Sin criterios publicados
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((c, i) => (
            <motion.li
              key={`${variant}-${i}-${c.texto}`}
              initial={{ opacity: 0, x: variant === 'suma' ? -16 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-start gap-3 border-b border-white/10 pb-4"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: headerColor, borderRadius: 2 }}
                aria-hidden
              >
                {icon}
              </span>
              <span
                className="text-sm leading-relaxed text-white/90 md:text-base"
                style={{ fontFamily: 'Lato, sans-serif' }}
              >
                {c.texto}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PuntosVictoriaSection({ config }: { config: PuntosVictoriaConfig }) {
  const criterios = normalizeCriterios(config.criterios)
  const suman = criterios.filter((c) => c.tipo === 'suma')
  const restan = criterios.filter((c) => c.tipo === 'resta')

  const eyebrow = config.eyebrow?.trim() || 'MECÁNICA'
  const titulo = config.titulo?.trim() || 'PUNTOS DE VICTORIA'
  const descripcion =
    config.descripcion?.trim() ||
    'El resultado del operativo se define por misiones cumplidas y conducta en campo. Los detalles se publicarán próximamente.'

  const vacio = criterios.length === 0

  return (
    <section
      id="puntos-victoria"
      data-section="puntos_victoria"
      className="relative w-full bg-[#111111] py-16 text-white md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-4 text-4xl leading-none md:text-6xl lg:text-7xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {titulo}
          </h2>
          <p
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg"
            style={{ fontFamily: 'Lato, sans-serif' }}
          >
            {descripcion}
          </p>
        </motion.div>

        {vacio ? (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center text-sm uppercase tracking-[0.25em] text-white/40"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            Sistema de puntos por definir
          </motion.p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-12 md:mt-20 md:grid-cols-2 md:gap-16">
            <CriterioList items={suman} variant="suma" />
            <CriterioList items={restan} variant="resta" />
          </div>
        )}
      </div>
    </section>
  )
}
