'use client'

import { motion } from 'framer-motion'
import type { NarrativaConfig } from '../lib/types'

export function NarrativaSection({ config }: { config: NarrativaConfig }) {
  const bloques = config.bloques ?? []

  return (
    <section
      data-section="narrativa"
      className="relative w-full bg-black py-24 text-white md:py-40"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:mb-24 md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          UN CONFLICTO. TRES TIEMPOS.
        </motion.p>

        <div className="space-y-20 md:space-y-32">
          {bloques.map((bloque, i) => (
            <motion.div
              key={`${bloque.anio}-${i}`}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-150px' }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="grid grid-cols-1 items-baseline gap-6 md:grid-cols-12 md:gap-8"
            >
              <div className="md:col-span-4">
                <p
                  className="text-6xl leading-none text-white md:text-8xl lg:text-9xl"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {bloque.anio}
                </p>
              </div>
              <div className="md:col-span-8">
                <p
                  className={`text-xl leading-snug md:text-3xl lg:text-4xl ${
                    i === bloques.length - 1 ? 'text-white' : 'text-white/70'
                  }`}
                  style={{ fontFamily: 'Jost, sans-serif', fontWeight: 400 }}
                >
                  {bloque.texto}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
