'use client'

import { motion } from 'framer-motion'
import type { MisionConfig, ObjetivoMision } from '../lib/types'
import { BH2_COLORS, BH2_HEADER_STYLE } from '../lib/theme'
import { CarruselFade } from './CarruselFade'

export function MisionSection({ config }: { config: MisionConfig }) {
  const titulo = config.titulo?.trim() || ''
  const objetivos = (config.objetivos ?? []).filter(
    (o) => o && (o.codigo?.trim() || o.titulo?.trim() || o.descripcion?.trim())
  )
  if (!titulo && objetivos.length === 0) return null

  const eyebrow = config.eyebrow?.trim() || 'OPERACIÓN'
  const descripcion = config.descripcion?.trim() || ''
  const cierre = config.cierre?.trim() || ''

  return (
    <section
      id="mision"
      data-section="mision"
      className="relative w-full overflow-hidden py-16 text-white md:py-24"
      style={{ backgroundColor: BH2_COLORS.jungle }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <p
            className="text-[0.65rem] tracking-[0.4em] text-[#F2B705] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          {titulo ? (
            <h2 className="mt-3 text-3xl leading-none md:text-5xl" style={BH2_HEADER_STYLE}>
              {titulo}
            </h2>
          ) : null}
          {descripcion ? (
            <p
              className="mt-4 text-sm leading-relaxed text-white/70 md:text-base"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              {descripcion}
            </p>
          ) : null}
        </motion.div>

        {objetivos.length > 0 ? (
          <>
            <div className="mt-10 hidden gap-4 md:grid md:grid-cols-3">
              {objetivos.map((obj, i) => (
                <ObjetivoCard key={`${obj.codigo}-${i}`} obj={obj} index={i} />
              ))}
            </div>
            <div className="mt-10 md:hidden">
              <CarruselFade fade={BH2_COLORS.jungle}>
                {objetivos.map((obj, i) => (
                  <div key={`${obj.codigo}-${i}`} className="w-[82%] shrink-0 snap-center">
                    <ObjetivoCard obj={obj} index={i} />
                  </div>
                ))}
              </CarruselFade>
              {objetivos.length > 1 ? (
                <p
                  className="mt-3 text-center text-[0.55rem] tracking-[0.3em] text-white/45"
                  style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
                >
                  DESLIZA
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {cierre ? (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mx-auto mt-10 max-w-2xl text-center text-[0.68rem] uppercase tracking-[0.28em] text-white/80"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
          >
            {cierre}
          </motion.p>
        ) : null}
      </div>
    </section>
  )
}

function ObjetivoCard({ obj, index }: { obj: ObjetivoMision; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="h-full border bg-[#1F2A17] p-5"
      style={{ borderColor: BH2_COLORS.border, borderRadius: 2 }}
    >
      <p
        className="text-5xl leading-none text-[#F2B705] opacity-90"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
      >
        {obj.codigo?.trim() || String(index + 1).padStart(2, '0')}
      </p>
      <h3
        className="mt-3 text-lg text-white"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, textTransform: 'uppercase' }}
      >
        {obj.titulo?.trim() || 'OBJETIVO'}
      </h3>
      {obj.descripcion?.trim() ? (
        <p className="mt-2 text-sm leading-relaxed text-white/70" style={{ fontFamily: 'Lato, sans-serif' }}>
          {obj.descripcion.trim()}
        </p>
      ) : null}
    </motion.article>
  )
}
