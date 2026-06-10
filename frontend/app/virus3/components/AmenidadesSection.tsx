'use client'

import { motion } from 'framer-motion'
import type { AmenidadesConfig } from '../lib/types'

export function AmenidadesSection({ config }: { config: AmenidadesConfig }) {
  const items = (config.items ?? []).filter((s) => typeof s === 'string' && s.trim())
  const eyebrow = config.eyebrow?.trim() || 'INCLUIDO'
  const titulo = config.titulo?.trim() || 'AMENIDADES'

  return (
    <section
      data-section="amenidades"
      className="relative w-full bg-[#111111] py-10 text-white md:py-14"
    >
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-2 text-2xl leading-none md:text-4xl"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
          >
            {titulo}
          </h2>
        </motion.div>

        {items.length === 0 ? (
          <p className="text-center text-sm text-white/50" style={{ fontFamily: 'Lato, sans-serif' }}>
            Lista de amenidades próximamente
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
            {items.map((item, i) => (
              <motion.li
                key={`${i}-${item}`}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2"
              >
                <span
                  className="shrink-0 text-sm text-[#CC4B37]"
                  style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                  aria-hidden
                >
                  ✓
                </span>
                <span
                  className="text-sm text-white/80 md:text-base"
                  style={{ fontFamily: 'Lato, sans-serif' }}
                >
                  {item.trim()}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
