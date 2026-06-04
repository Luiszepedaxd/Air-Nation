'use client'

import { motion } from 'framer-motion'
import type { InscripcionConfig, VentanaPrecio } from '../lib/types'
import { estadoVentana, formatoRangoCorto, type EstadoVentana } from '../lib/fechas'
import { TG_COLORS, TG_FONTS } from './ui/theme'
import { SectionLabel } from './ui/SectionLabel'
import { StampBadge } from './ui/StampBadge'

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
        precio: Number(o.precio) || 0,
      }
    })
    .filter((v): v is VentanaPrecio => v !== null)
}

function stampFor(estado: EstadoVentana): { texto: string; color: string } {
  if (estado === 'activa') return { texto: 'PRECIO ACTUAL', color: TG_COLORS.red }
  if (estado === 'futura') return { texto: 'PRÓXIMAMENTE', color: TG_COLORS.olive }
  return { texto: 'CERRADA', color: '#777' }
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('//')
}

function VentanaCard({
  ventana,
  estado,
  index,
}: {
  ventana: VentanaPrecio
  estado: EstadoVentana
  index: number
}) {
  const isActiva = estado === 'activa'
  const isPasada = estado === 'pasada'
  const stamp = stampFor(estado)
  const precioColor = isActiva ? TG_COLORS.red : '#FFFFFF'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      className="relative overflow-hidden p-6 md:p-7"
      style={{
        backgroundColor: '#23231F',
        border: `1px solid ${isActiva ? TG_COLORS.red : TG_COLORS.border}`,
        boxShadow: isActiva ? '0 0 32px -8px rgba(204,75,55,0.4)' : '0 2px 8px rgba(0,0,0,0.3)',
        opacity: isPasada ? 0.4 : 1,
      }}
    >
      {/* Esquina doblada */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0"
        style={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 20px 20px 0',
          borderColor: `transparent ${TG_COLORS.border} transparent transparent`,
        }}
      />

      <div className="mb-4">
        <StampBadge color={stamp.color} rotate={-4} className="!text-[0.5rem] md:!text-[0.6rem]">
          {stamp.texto}
        </StampBadge>
      </div>

      <p
        className="text-[0.6rem] tracking-[0.2em] text-white/50"
        style={{ fontFamily: TG_FONTS.mono, fontWeight: 400 }}
      >
        {formatoRangoCorto(ventana.fecha_desde, ventana.fecha_hasta)}
      </p>
      <p
        className="mt-2 text-lg uppercase md:text-xl"
        style={{ fontFamily: TG_FONTS.header, color: '#fff' }}
      >
        {ventana.label || 'Inscripción'}
      </p>

      <p
        className="mt-5 leading-none"
        style={{ fontFamily: TG_FONTS.header, color: precioColor, fontSize: 'clamp(2.2rem, 8vw, 3.5rem)' }}
      >
        ${ventana.precio > 0 ? ventana.precio.toLocaleString('es-MX') : '—'}
        <span className="ml-2 text-base text-white/50" style={{ fontFamily: TG_FONTS.mono }}>
          MXN
        </span>
      </p>
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
  const estados = ventanas.map((v) => estadoVentana(v, ahora))
  const hayActiva = estados.some((e) => e === 'activa')

  const incluye = (config.incluye ?? []).filter((s) => typeof s === 'string' && s.trim())
  const titulo = config.titulo?.trim() || 'INSCRIPCIÓN'
  const subtitulo = config.subtitulo?.trim() || ''
  const cta1Link = config.cta1_link?.trim() || ''
  const cta2Link = config.cta2_link?.trim() || ''

  return (
    <section
      id="inscripcion"
      data-section="inscripcion"
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: TG_COLORS.dark, color: '#fff' }}
    >
      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
        <SectionLabel numero="05" nombre={titulo} color="#A8B271" className="mb-10" />

        <h2
          className="text-3xl leading-tight md:text-5xl"
          style={{ fontFamily: TG_FONTS.header, color: '#fff' }}
        >
          {titulo}
        </h2>
        {subtitulo ? (
          <p
            className="mt-3 max-w-2xl text-base md:text-lg"
            style={{ fontFamily: TG_FONTS.body, color: 'rgba(255,255,255,0.7)' }}
          >
            {subtitulo}
          </p>
        ) : null}

        {ventanas.length === 0 ? (
          <p
            className="mt-12 text-sm uppercase tracking-[0.2em]"
            style={{ fontFamily: TG_FONTS.mono, color: 'rgba(255,255,255,0.5)' }}
          >
            Ventanas de precio próximamente
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ventanas.map((v, i) => (
              <VentanaCard key={`${v.fecha_desde}-${i}`} ventana={v} estado={estados[i]} index={i} />
            ))}
          </div>
        )}

        {!hayActiva && ventanas.length > 0 ? (
          <p
            className="mt-6 text-[0.65rem] tracking-[0.15em]"
            style={{ fontFamily: TG_FONTS.mono, color: 'rgba(255,255,255,0.4)' }}
          >
            No hay ventana activa en este momento
          </p>
        ) : null}

        {incluye.length > 0 ? (
          <div className="mt-14">
            <p
              className="mb-4 text-[0.7rem] tracking-[0.25em]"
              style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.brass }}
            >
              TU INSCRIPCIÓN INCLUYE
            </p>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {incluye.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span aria-hidden className="mt-0.5 shrink-0" style={{ color: TG_COLORS.olive }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 6" stroke="#A8B271" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span
                    className="text-sm md:text-base"
                    style={{ fontFamily: TG_FONTS.body, color: 'rgba(255,255,255,0.85)' }}
                  >
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        ) : null}

        {config.nota?.trim() ? (
          <p
            className="mt-8 text-[0.7rem] leading-relaxed"
            style={{ fontFamily: TG_FONTS.mono, color: 'rgba(255,255,255,0.5)' }}
          >
            {config.nota}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {cta1Link ? (
            <a
              href={cta1Link}
              {...(isExternalHref(cta1Link) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex w-full items-center justify-center px-7 py-3.5 text-[0.7rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 sm:w-auto"
              style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, backgroundColor: TG_COLORS.red }}
            >
              {config.cta1_texto?.trim() || 'INSCRIBIRME'}
            </a>
          ) : null}
          {cta2Link ? (
            <a
              href={cta2Link}
              {...(isExternalHref(cta2Link) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex w-full items-center justify-center border-2 px-7 py-3.5 text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:bg-[#4A5328] hover:text-white sm:w-auto"
              style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, borderColor: TG_COLORS.olive, color: '#A8B271' }}
            >
              {config.cta2_texto?.trim() || 'MÁS INFO POR WHATSAPP'}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}
