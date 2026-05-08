'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { NarrativaConfig } from '../lib/types'

export function NarrativaSection({ config }: { config: NarrativaConfig }) {
  const bloques = config.bloques ?? []
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.85', 'end 0.4'],
  })
  const lineWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

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
          className="mb-12 text-center text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:mb-20 md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          UN CONFLICTO. TRES TIEMPOS.
        </motion.p>

        <div ref={ref} className="relative pt-4">
          {/* Línea base (gris claro) */}
          <div className="absolute left-0 right-0 top-[18px] h-[2px] bg-[#E5E0DA] md:top-[22px]" />

          {/* Línea animada (coral) */}
          <motion.div
            className="absolute left-0 top-[18px] h-[2px] bg-[#CC4B37] md:top-[22px]"
            style={{ width: lineWidth }}
          />

          {/* Nodos */}
          <div className="relative grid grid-cols-3 gap-3 md:gap-8">
            {bloques.map((bloque, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.25, ease: 'easeOut' }}
                className="flex flex-col items-center text-center"
              >
                {/* Punto en la línea */}
                <div className="relative h-9 w-9 md:h-11 md:w-11">
                  <span className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-[#CC4B37] ring-4 ring-[#F5F3EF] md:h-4 md:w-4" />
                </div>

                {/* Año */}
                <p
                  className="mt-3 text-3xl leading-none text-[#111111] sm:text-4xl md:mt-5 md:text-6xl lg:text-7xl"
                  style={{
                    fontFamily: 'Jost, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {bloque.anio}
                </p>

                {/* Texto */}
                <p
                  className={`mt-3 px-1 text-xs leading-snug sm:text-sm md:mt-5 md:text-base lg:text-lg ${
                    i === bloques.length - 1 ? 'text-[#111111]' : 'text-[#666666]'
                  }`}
                  style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400 }}
                >
                  {bloque.texto}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
