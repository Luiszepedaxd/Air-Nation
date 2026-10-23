'use client'

import { motion } from 'framer-motion'
import type { NarrativaConfig } from '../lib/types'
import { BH2_HEADER_STYLE } from '../lib/theme'

export function NarrativaSection({ config }: { config: NarrativaConfig }) {
  const bloques = (config.bloques ?? []).filter((b) => b && (b.titulo?.trim() || b.texto?.trim()))
  const titulo = config.titulo?.trim() || ''
  if (!titulo && bloques.length === 0) return null

  const eyebrow = config.eyebrow?.trim() || 'EXPEDIENTE'

  return (
    <section
      id="narrativa"
      data-section="narrativa"
      className="relative w-full overflow-hidden bg-[#F5F3EF] py-16 text-[#111111] md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {eyebrow}
        </motion.p>
        {titulo ? (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mt-3 max-w-4xl text-center text-3xl leading-none md:text-5xl"
            style={BH2_HEADER_STYLE}
          >
            {titulo}
          </motion.h2>
        ) : null}

        {bloques.length > 0 ? (
          <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
            {bloques.map((bloque, i) => (
              <motion.article
                key={`${bloque.titulo}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="border border-[#E5E0DA] bg-white p-5 md:p-6"
                style={{ borderRadius: 2 }}
              >
                {bloque.titulo?.trim() ? (
                  <p
                    className="inline-block border border-[#CC4B37]/50 px-2 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-[#CC4B37]"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                  >
                    {bloque.titulo.trim()}
                  </p>
                ) : null}
                {bloque.texto?.trim() ? (
                  <p
                    className="mt-4 text-sm leading-relaxed text-[#333333] md:text-base"
                    style={{ fontFamily: 'Lato, sans-serif' }}
                  >
                    {bloque.texto.trim()}
                  </p>
                ) : null}
              </motion.article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
