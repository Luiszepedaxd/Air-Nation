'use client'

import { motion } from 'framer-motion'
import type { InscripcionConfig, VentanaPrecio } from '../lib/types'
import { estadoVentana, formatoRangoCorto, type EstadoVentana } from '../lib/fechas'

function normalizeVentanas(raw: unknown): VentanaPrecio[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return null
      const o = row as Record<string, unknown>
      const fecha_desde = typeof o.fecha_desde === 'string' ? o.fecha_desde.slice(0, 10) : ''
      const fecha_hasta = typeof o.fecha_hasta === 'string' ? o.fecha_hasta.slice(0, 10) : ''
      if (!fecha_desde || !fecha_hasta) return null
      return {
        fecha_desde,
        fecha_hasta,
        label: typeof o.label === 'string' ? o.label : 'Ventana',
        precio_general: Number(o.precio_general) || 0,
        precio_preferente: Number(o.precio_preferente) || 0,
      }
    })
    .filter((v): v is VentanaPrecio => v !== null)
}

function badgeLabel(estado: EstadoVentana): string {
  if (estado === 'activa') return 'PRECIO ACTUAL'
  if (estado === 'futura') return 'PRÓXIMAMENTE'
  return 'CERRADA'
}

function VentanaCard({
  ventana,
  estado,
}: {
  ventana: VentanaPrecio
  estado: EstadoVentana
}) {
  const isActiva = estado === 'activa'
  const isPasada = estado === 'pasada'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      animate={isActiva ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative flex flex-col border bg-white p-6 text-left transition-all md:p-8 ${
        isActiva
          ? 'border-[#CC4B37] shadow-[0_12px_40px_-12px_rgba(204,75,55,0.45)]'
          : 'border-[#E5E0DA]'
      } ${isPasada ? 'opacity-40' : ''}`}
      style={{ borderRadius: 2, borderWidth: isActiva ? 2 : 1 }}
    >
      <span
        className={`absolute right-4 top-4 px-2 py-1 text-[0.55rem] tracking-[0.2em] ${
          isActiva
            ? 'bg-[#CC4B37] text-white'
            : isPasada
              ? 'bg-[#EEEEEE] text-[#666666] line-through'
              : 'border border-[#CCCCCC] bg-transparent text-[#666666]'
        }`}
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
      >
        {badgeLabel(estado)}
      </span>

      <p
        className="text-[0.6rem] tracking-[0.25em] text-[#666666]"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
      >
        {formatoRangoCorto(ventana.fecha_desde, ventana.fecha_hasta)}
      </p>
      <p
        className="mt-3 text-lg leading-tight text-[#111111] md:text-xl"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
      >
        {ventana.label || 'Inscripción'}
      </p>

      <div className="mt-6 border-t border-[#EEEEEE] pt-6">
        <p
          className="text-[0.55rem] tracking-[0.3em] text-[#999999]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          GENERAL
        </p>
        <p
          className="mt-1 text-4xl leading-none text-[#111111] md:text-5xl"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
        >
          ${ventana.precio_general > 0 ? ventana.precio_general.toLocaleString('es-MX') : '—'}
          <span className="ml-1 text-lg text-[#666666]">MXN</span>
        </p>
      </div>

      <div className="mt-4">
        <p
          className="text-[0.55rem] tracking-[0.3em] text-[#999999]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          PREFERENTE
        </p>
        <p
          className="mt-1 text-2xl leading-none text-[#CC4B37] md:text-3xl"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
        >
          ${ventana.precio_preferente > 0 ? ventana.precio_preferente.toLocaleString('es-MX') : '—'}
          <span className="ml-1 text-sm text-[#666666]">MXN</span>
        </p>
      </div>
    </motion.div>
  )
}

export function InscripcionSection({
  config,
  renderedAt,
}: {
  config: InscripcionConfig
  renderedAt?: string
}) {
  const ahora = renderedAt ? new Date(renderedAt) : new Date()
  const ventanas = normalizeVentanas(config.ventanas)

  const eyebrow = config.eyebrow?.trim() || 'INSCRIPCIÓN'
  const titulo = config.titulo?.trim() || 'ÚNETE AL OPERATIVO'
  const subtitulo =
    config.subtitulo?.trim() ||
    'Consulta las ventanas de precio y regístrate con el productor del evento.'
  const notaPreferente =
    config.nota_preferente?.trim() ||
    'Preferente solo para Rust Crew 2025 (ganadores edición pasada).'
  const notaCambio =
    config.nota_cambio_nombre?.trim() ||
    'Registro de nombre puede ser cambiado hasta el 20 sep 2026.'

  const estados = ventanas.map((v) => estadoVentana(v, ahora))
  const hayActiva = estados.some((e) => e === 'activa')

  return (
    <section
      id="inscripcion"
      data-section="inscripcion"
      className="relative w-full bg-[#F5F3EF] py-20 text-[#111111] md:py-32"
    >
      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {eyebrow}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 text-center text-4xl leading-none sm:text-5xl md:text-7xl"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          {titulo}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mt-6 max-w-2xl text-center text-base text-[#666666] md:text-lg"
          style={{ fontFamily: 'Lato, sans-serif' }}
        >
          {subtitulo}
        </motion.p>

        {ventanas.length === 0 ? (
          <p
            className="mt-12 text-center text-sm uppercase tracking-[0.2em] text-[#999999]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            Ventanas de precio próximamente
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-3 md:gap-4">
            {ventanas.map((v, i) => (
              <VentanaCard key={`${v.fecha_desde}-${i}`} ventana={v} estado={estados[i]} />
            ))}
          </div>
        )}

        {!hayActiva && ventanas.length > 0 ? (
          <p
            className="mt-6 text-center text-[0.65rem] tracking-[0.15em] text-[#999999]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            No hay ventana activa en este momento
          </p>
        ) : null}

        <p
          className="mt-8 text-center text-[0.7rem] leading-relaxed text-[#666666] md:text-xs"
          style={{ fontFamily: 'Lato, sans-serif' }}
        >
          {notaPreferente}
        </p>
        <p
          className="mt-2 text-center text-[0.65rem] leading-relaxed text-[#999999] md:text-[0.7rem]"
          style={{ fontFamily: 'Lato, sans-serif' }}
        >
          {notaCambio}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4"
        >
          {config.cta1_link?.trim() ? (
            <a
              href={config.cta1_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full max-w-sm items-center justify-center bg-[#CC4B37] px-6 py-3.5 text-[0.7rem] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 md:w-auto"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
            >
              {config.cta1_texto?.trim() || 'REGISTRARME POR WHATSAPP'}
            </a>
          ) : null}
          <a
            href={config.cta2_link?.trim() || '#facciones'}
            className="inline-flex w-full max-w-sm items-center justify-center border border-[#111111] bg-transparent px-6 py-3.5 text-[0.7rem] uppercase tracking-[0.18em] text-[#111111] transition-colors hover:bg-[#111111] hover:text-white md:w-auto"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
          >
            {config.cta2_texto?.trim() || 'VER FACCIONES'}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
