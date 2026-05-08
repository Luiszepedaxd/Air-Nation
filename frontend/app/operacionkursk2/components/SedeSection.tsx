'use client'

import { motion } from 'framer-motion'
import type { SedeConfig } from '../lib/types'

export function SedeSection({ config }: { config: SedeConfig }) {
  return (
    <section
      id="sede"
      data-section="sede"
      className="relative w-full bg-[#0a0a0a] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-20"
        >
          <p
            className="text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {config.eyebrow}
          </p>
          <h2
            className="mt-4 text-4xl leading-none md:text-7xl lg:text-8xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {config.titulo}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-6">
            <div className="md:sticky md:top-24">
              {config.imagen_url ? (
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#1a1a1a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <motion.img
                    src={config.imagen_url}
                    alt={config.titulo}
                    className="h-full w-full object-cover"
                    style={{ filter: 'grayscale(0.3) contrast(1.05)' }}
                    initial={{ scale: 1.1 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-[#1a1a1a] text-xs uppercase tracking-[0.2em] text-white/30">
                  Imagen pendiente
                </div>
              )}
            </div>
          </div>

          <div className="space-y-12 md:col-span-6 md:space-y-20 md:py-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
            >
              <p
                className="text-base leading-relaxed text-white/80 md:text-lg"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 400 }}
              >
                {config.descripcion}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
              className="border-t border-white/10 pt-8"
            >
              <p
                className="text-[0.6rem] tracking-[0.3em] text-white/50"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
              >
                DIRECCIÓN
              </p>
              <p
                className="mt-3 text-base text-white md:text-lg"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
              >
                {config.direccion}
              </p>
            </motion.div>

            {config.coordenadas ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7 }}
                className="border-t border-white/10 pt-8"
              >
                <p
                  className="text-[0.6rem] tracking-[0.3em] text-white/50"
                  style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
                >
                  COORDENADAS
                </p>
                <p
                  className="mt-3 text-base text-white md:text-lg"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontWeight: 500,
                  }}
                >
                  {config.coordenadas}
                </p>
              </motion.div>
            ) : null}

            {config.maps_link ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7 }}
                className="pt-4"
              >
                <a
                  href={config.maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-block text-[0.7rem] tracking-[0.25em] text-white transition-colors md:text-xs"
                  style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                >
                  <span className="text-[#CC4B37]">[ </span>
                  <span className="border-b border-white/0 transition-all group-hover:border-white">
                    ABRIR EN GOOGLE MAPS
                  </span>
                  <span className="text-[#CC4B37]"> ]</span>
                </a>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
