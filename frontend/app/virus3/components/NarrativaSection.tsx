'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { NarrativaConfig } from '../lib/types'

export function NarrativaSection({ config }: { config: NarrativaConfig }) {
  const bloques = (config.bloques ?? []).filter(
    (b) => b && (b.titulo?.trim() || b.texto?.trim())
  )
  const n = Math.max(bloques.length, 1)
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  })
  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const gridColsClass =
    n === 1
      ? 'grid-cols-1'
      : n === 2
        ? 'grid-cols-2'
        : n === 3
          ? 'grid-cols-3'
          : n === 4
            ? 'grid-cols-2 md:grid-cols-4'
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

  const containerMaxW = n === 1 ? 'max-w-md' : n === 2 ? 'max-w-3xl' : ''

  const labelClass =
    n <= 2
      ? 'text-xl leading-tight sm:text-2xl md:mt-5 md:text-3xl lg:text-4xl'
      : 'text-lg leading-tight sm:text-xl md:mt-5 md:text-2xl lg:text-3xl'

  const eyebrow = config.eyebrow?.trim() || 'LA HISTORIA'
  const titulo = config.titulo?.trim()

  return (
    <section
      data-section="narrativa"
      className="relative w-full bg-[#F5F3EF] py-16 text-[#111111] md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-center text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {eyebrow}
        </motion.p>
        {titulo ? (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl leading-none md:mb-16 md:text-5xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {titulo}
          </motion.h2>
        ) : (
          <div className="mb-12 md:mb-16" />
        )}

        {bloques.length === 0 ? (
          <p
            className="text-center text-sm text-[#666666]"
            style={{ fontFamily: 'Lato, sans-serif' }}
          >
            Narrativa próximamente
          </p>
        ) : (
          <div ref={ref} className={`relative mx-auto pt-4 ${containerMaxW}`}>
            <div className="absolute left-0 right-0 top-[18px] h-[2px] bg-[#E5E0DA] md:top-[22px]" />
            <motion.div
              className="absolute left-0 top-[18px] h-[2px] bg-[#CC4B37] md:top-[22px]"
              style={{ width: lineWidth }}
            />
            <div className={`relative grid gap-3 md:gap-8 ${gridColsClass}`}>
              {bloques.map((bloque, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.25, ease: 'easeOut' }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="relative h-9 w-9 md:h-11 md:w-11">
                    <span className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-[#CC4B37] ring-4 ring-[#F5F3EF] md:h-4 md:w-4" />
                  </div>
                  <p
                    className={`mt-3 text-[#111111] ${labelClass}`}
                    style={{
                      fontFamily: 'Jost, sans-serif',
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {bloque.titulo?.trim() || 'Bloque'}
                  </p>
                  <p
                    className={`mt-3 text-xs leading-snug sm:text-sm md:mt-5 md:text-base lg:text-lg ${
                      n <= 2 ? 'px-2' : 'px-1'
                    } ${i === bloques.length - 1 ? 'text-[#111111]' : 'text-[#666666]'}`}
                    style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400 }}
                  >
                    {bloque.texto?.trim() || 'Sin contenido aún'}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
