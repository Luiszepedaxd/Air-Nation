'use client'

import { motion } from 'framer-motion'
import type { InscripcionConfig } from '../lib/types'

export function InscripcionSection({ config }: { config: InscripcionConfig }) {
  return (
    <section
      id="inscripcion"
      data-section="inscripcion"
      className="relative w-full bg-[#F5F3EF] py-20 text-[#111111] md:py-32"
    >
      <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {config.eyebrow}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-4 text-4xl leading-none sm:text-5xl md:text-7xl lg:text-8xl"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          {config.titulo}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 1.15, rotate: -10 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -6 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.3 }}
          className="my-10 inline-block md:my-14"
        >
          <div className="inline-flex flex-col items-center border-4 border-[#CC4B37] bg-white px-8 py-5 shadow-lg md:px-14 md:py-8">
            <p
              className="text-[0.6rem] tracking-[0.4em] text-[#666] md:text-[0.7rem]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
            >
              {config.subtitulo}
            </p>
            <p
              className="mt-2 text-6xl leading-none text-[#CC4B37] md:text-8xl lg:text-9xl"
              style={{
                fontFamily: 'Jost, sans-serif',
                fontWeight: 900,
                letterSpacing: '-0.02em',
              }}
            >
              {config.precio}
            </p>
            <p
              className="mt-3 text-[0.6rem] tracking-[0.3em] text-[#666] md:text-xs"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              HASTA {config.fecha_limite}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4"
        >
          {config.cta1_link ? (
            <a
              href={config.cta1_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full max-w-xs items-center justify-center bg-[#CC4B37] px-6 py-3.5 text-[0.7rem] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 md:w-auto md:min-w-[260px]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              {config.cta1_texto}
            </a>
          ) : null}
          {config.cta2_link ? (
            <a
              href={config.cta2_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full max-w-xs items-center justify-center border border-[#111] bg-transparent px-6 py-3.5 text-[0.7rem] uppercase tracking-[0.18em] text-[#111] transition-colors hover:bg-[#111] hover:text-white md:w-auto md:min-w-[260px]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              {config.cta2_texto}
            </a>
          ) : null}
        </motion.div>
      </div>
    </section>
  )
}
