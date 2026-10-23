'use client'

import { motion } from 'framer-motion'
import type { SoldadoCeroConfig } from '../lib/types'
import { BH2_COLORS, BH2_HAZARD_STRIPE, BH2_HEADER_STYLE } from '../lib/theme'

export function SoldadoCeroSection({ config }: { config: SoldadoCeroConfig }) {
  const titulo = config.titulo?.trim() || ''
  if (!titulo) return null

  const eyebrow = config.eyebrow?.trim() || 'AMENAZA'
  const imagen = config.imagen_url?.trim() || ''
  const datos = (config.datos ?? []).filter((d) => d && (d.label?.trim() || d.valor?.trim()))
  const advertencia = config.advertencia?.trim() || ''

  return (
    <section
      id="soldado-cero"
      data-section="soldado_cero"
      className="relative w-full overflow-hidden text-white"
      style={{ backgroundColor: BH2_COLORS.jungle }}
    >
      <div className="h-1.5 w-full" style={{ background: BH2_HAZARD_STRIPE }} aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-start md:px-8 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative aspect-[3/4] overflow-hidden bg-[#1F2A17]"
          style={{ borderRadius: 2 }}
        >
          {imagen ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagen} alt="" className="h-full w-full object-cover grayscale-[0.35]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141A10]/80 via-black/20 to-black/10" />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <svg viewBox="0 0 64 96" className="h-36 w-24 text-white/25" fill="currentColor" aria-hidden>
                <circle cx="32" cy="16" r="10" />
                <path d="M14 42c2-12 10-18 18-18s16 6 18 18v20H14V42z" />
                <path d="M18 62h12v30H18zM34 62h12v30H34z" />
              </svg>
              <p
                className="text-[0.65rem] tracking-[0.28em] text-white/50"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
              >
                IMAGEN CLASIFICADA
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
        >
          <p
            className="text-[0.65rem] tracking-[0.4em] text-[#F2B705]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          <h2 className="mt-3 text-4xl leading-none md:text-6xl" style={BH2_HEADER_STYLE}>
            {titulo}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {config.nombre_clave?.trim() ? (
              <span className="border border-[#2E3A24] px-2 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-[#C8B27A]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                {config.nombre_clave.trim()}
              </span>
            ) : null}
            {config.clasificacion?.trim() ? (
              <span className="border border-[#2E3A24] px-2 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-[#C8B27A]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                {config.clasificacion.trim()}
              </span>
            ) : null}
            {config.estado?.trim() ? (
              <span className="inline-flex items-center gap-2 border border-[#CC4B37]/50 px-2 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-white" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#CC4B37]" aria-hidden />
                {config.estado.trim()}
              </span>
            ) : null}
          </div>

          {config.descripcion?.trim() ? (
            <p className="mt-5 text-sm leading-relaxed text-white/75 md:text-base" style={{ fontFamily: 'Lato, sans-serif' }}>
              {config.descripcion.trim()}
            </p>
          ) : null}

          {datos.length > 0 ? (
            <dl className="mt-6">
              {datos.map((d, i) => (
                <div key={`${d.label}-${i}`} className="flex items-baseline justify-between gap-4 border-b border-dotted border-white/25 py-2">
                  <dt className="max-w-[46%] shrink-0 break-words text-[0.62rem] uppercase tracking-[0.14em] text-white/45" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                    {d.label?.trim()}
                  </dt>
                  <dd className="min-w-0 break-words text-right text-sm text-white" style={{ fontFamily: 'Lato, sans-serif' }}>
                    {d.valor?.trim()}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {advertencia ? (
            <p
              className="mt-6 border border-[#F2B705] p-4 text-sm text-[#F2B705]"
              style={{ fontFamily: 'Lato, sans-serif', borderRadius: 2 }}
            >
              {advertencia}
            </p>
          ) : null}
        </motion.div>
      </div>
    </section>
  )
}
