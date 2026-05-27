'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { PuntosVictoriaConfig, CriterioPunto } from '../lib/types'
import { Grain } from './Grain'

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const ACCENT_YELLOW = '#F2C200'

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

function TypewriterHeader({
  text,
  color,
  startDelay = 0,
}: {
  text: string
  color: string
  startDelay?: number
}) {
  const [display, setDisplay] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay * 1000)
    return () => clearTimeout(t)
  }, [startDelay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = window.setInterval(() => {
      i += 1
      setDisplay(text.slice(0, i))
      if (i >= text.length) window.clearInterval(interval)
    }, 30)
    return () => window.clearInterval(interval)
  }, [started, text])

  return (
    <p
      className="mb-6 min-h-[1.25rem] text-[0.65rem] tracking-[0.28em] md:text-xs"
      style={{ fontFamily: MONO, fontWeight: 700, color }}
    >
      {display}
      {started && display.length < text.length ? (
        <span className="ml-0.5 inline-block w-[0.5em] animate-pulse opacity-80">_</span>
      ) : null}
    </p>
  )
}

function CornerBrackets({ color }: { color: string }) {
  const base = 'pointer-events-none absolute h-3 w-3 md:h-4 md:w-4'
  const border = `2px solid ${color}`
  return (
    <>
      <span className={`${base} left-0 top-0`} style={{ borderTop: border, borderLeft: border }} />
      <span className={`${base} right-0 top-0`} style={{ borderTop: border, borderRight: border }} />
      <span
        className={`${base} bottom-0 left-0`}
        style={{ borderBottom: border, borderLeft: border }}
      />
      <span
        className={`${base} bottom-0 right-0`}
        style={{ borderBottom: border, borderRight: border }}
      />
    </>
  )
}

function CriterioCard({
  criterio,
  color,
  icon,
  index,
}: {
  criterio: CriterioPunto
  color: string
  icon: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="group mb-2 flex items-start gap-3 px-4 py-3 transition-[border-color,background-color] duration-200 last:mb-0"
      style={{
        border: `1px solid ${color}33`,
        backgroundColor: `${color}0A`,
        borderRadius: 2,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = `${color}99`
        el.style.backgroundColor = `${color}14`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = `${color}33`
        el.style.backgroundColor = `${color}0A`
      }}
    >
      <span
        className="w-8 shrink-0 text-[0.7rem] tracking-tight md:w-8"
        style={{ fontFamily: MONO, fontWeight: 700, color }}
        aria-hidden
      >
        {icon}
      </span>
      <span
        className="min-w-0 flex-1 text-sm leading-relaxed text-white/90 md:text-[0.95rem]"
        style={{ fontFamily: 'Lato, sans-serif' }}
      >
        {criterio.texto}
      </span>
    </motion.div>
  )
}

function TacticalPanel({
  items,
  variant,
  headerDelay,
}: {
  items: CriterioPunto[]
  variant: 'suma' | 'resta'
  headerDelay?: number
}) {
  const color = variant === 'suma' ? '#3AA76D' : '#CC4B37'
  const headerText =
    variant === 'suma' ? '[ + ] CRITERIOS QUE SUMAN' : '[ - ] CRITERIOS QUE RESTAN'
  const icon = variant === 'suma' ? '[+]' : '[-]'

  return (
    <div className="relative p-5 md:p-8">
      <CornerBrackets color={color} />
      <TypewriterHeader text={headerText} color={color} startDelay={headerDelay ?? 0} />
      {items.length === 0 ? (
        <p className="text-sm text-white/50" style={{ fontFamily: 'Lato, sans-serif' }}>
          Sin criterios publicados
        </p>
      ) : (
        <div>
          {items.map((c, i) => (
            <CriterioCard key={`${variant}-${i}-${c.texto}`} criterio={c} color={color} icon={icon} index={i} />
          ))}
        </div>
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
      className="relative w-full overflow-hidden bg-[#111111] py-16 text-white md:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 4px)',
        }}
      />
      <Grain opacity={0.04} />

      <div className="relative z-[1] mx-auto max-w-6xl px-4 md:px-8">
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
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            {titulo}
          </h2>
          <p
            className="mx-auto mt-4 max-w-2xl text-[10px] tracking-[0.22em] md:text-xs"
            style={{ fontFamily: MONO, fontWeight: 700, color: ACCENT_YELLOW }}
          >
            [ OBJETIVO: VICTORIA POR PUNTOS ACUMULADOS ]
          </p>
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
            style={{ fontFamily: MONO, fontWeight: 700 }}
          >
            Sistema de puntos por definir
          </motion.p>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-6 md:mt-20 md:grid-cols-2 md:gap-8 lg:gap-12">
            <TacticalPanel items={suman} variant="suma" headerDelay={0.2} />
            <TacticalPanel items={restan} variant="resta" headerDelay={0.5} />
          </div>
        )}

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-16 max-w-3xl px-2 text-center text-[9px] leading-relaxed tracking-[0.18em] md:mt-20 md:text-[10px] md:tracking-[0.22em]"
          style={{
            fontFamily: MONO,
            fontWeight: 700,
            color: ACCENT_YELLOW,
            opacity: 0.7,
          }}
        >
          [ SISTEMA SUJETO A AJUSTES POR EL EQUIPO ORGANIZADOR ANTES DEL EVENTO ]
        </motion.p>
      </div>
    </section>
  )
}
