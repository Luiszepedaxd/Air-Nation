'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SedeConfig } from '../lib/types'

export function SedeSection({ config }: { config: SedeConfig }) {
  const imagenesArr = (Array.isArray(config.imagenes) ? config.imagenes : []).filter(
    (u): u is string => typeof u === 'string' && u.trim().length > 0
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const goPrev = () =>
    setActiveIndex((i) => (i - 1 + imagenesArr.length) % imagenesArr.length)
  const goNext = () => setActiveIndex((i) => (i + 1) % imagenesArr.length)

  const eyebrow = config.eyebrow?.trim() || 'SEDE'
  const titulo = config.titulo?.trim() || 'Ex Normal de Perote'

  return (
    <section
      id="sede"
      data-section="sede"
      className="relative w-full bg-[#FFFFFF] py-16 text-[#111111] md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-12"
        >
          <p
            className="text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-3 text-3xl leading-none sm:text-4xl md:text-5xl lg:text-6xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {titulo}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            {imagenesArr.length === 0 ? (
              <div
                className="flex h-[50vh] w-full items-center justify-center border border-[#EEEEEE] bg-white text-xs uppercase tracking-[0.2em] text-[#999]"
                style={{ borderRadius: 2 }}
              >
                Imágenes pendientes
              </div>
            ) : (
              <div className="relative w-full">
                <button
                  type="button"
                  className="relative h-[60vh] w-full cursor-zoom-in overflow-hidden bg-white md:h-[70vh]"
                  style={{ borderRadius: 2 }}
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Ampliar foto"
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeIndex}
                      src={imagenesArr[activeIndex]}
                      alt={`${titulo} ${activeIndex + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-full w-full object-cover object-center"
                    />
                  </AnimatePresence>
                </button>

                {imagenesArr.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        goPrev()
                      }}
                      className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-[#111111] shadow-md transition-colors hover:bg-[#CC4B37] hover:text-white"
                      style={{ borderRadius: 2 }}
                      aria-label="Anterior"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        goNext()
                      }}
                      className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-white/90 text-[#111111] shadow-md transition-colors hover:bg-[#CC4B37] hover:text-white"
                      style={{ borderRadius: 2 }}
                      aria-label="Siguiente"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-6 md:col-span-5">
            <p
              className="text-base leading-relaxed text-[#666666] lg:text-lg"
              style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400 }}
            >
              {config.descripcion?.trim() ||
                'La sede del operativo se publicará próximamente con detalles de acceso y logística.'}
            </p>

            <div className="border-t border-[#EEEEEE] pt-5">
              <p
                className="text-[0.6rem] tracking-[0.3em] text-[#CC4B37]"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
              >
                DIRECCIÓN
              </p>
              <p
                className="mt-2 text-base text-[#111111]"
                style={{ fontFamily: 'Lato, sans-serif', fontWeight: 500 }}
              >
                {config.direccion?.trim() || 'Ex Normal de Perote, Veracruz'}
              </p>
            </div>

            {config.coordenadas?.trim() ? (
              <div className="border-t border-[#EEEEEE] pt-5">
                <p
                  className="text-[0.6rem] tracking-[0.3em] text-[#CC4B37]"
                  style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
                >
                  COORDENADAS
                </p>
                <p
                  className="mt-2 text-base text-[#111111]"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontWeight: 500,
                  }}
                >
                  {config.coordenadas}
                </p>
              </div>
            ) : null}

            {config.maps_link?.trim() ? (
              <div className="pt-2">
                <a
                  href={config.maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#CC4B37] px-5 py-3 text-[0.65rem] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                  style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
                >
                  Abrir en Google Maps
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && imagenesArr[activeIndex] ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxOpen(false)
              }}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-white hover:text-[#CC4B37]"
              aria-label="Cerrar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagenesArr[activeIndex]}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
