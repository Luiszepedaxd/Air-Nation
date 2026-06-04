'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SedeConfig } from '../lib/types'
import { TG_COLORS, TG_FONTS, TG_HEADER_STYLE } from './ui/theme'
import { PaperTexture } from './ui/PaperTexture'
import { SectionLabel } from './ui/SectionLabel'
import { DossierCard } from './ui/DossierCard'

export function SedeSection({ config }: { config: SedeConfig }) {
  const imagenesArr = (config.imagenes ?? []).filter(
    (u): u is string => typeof u === 'string' && u.trim().length > 0
  )

  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const goPrev = () =>
    setActiveIndex((i) => (i - 1 + imagenesArr.length) % imagenesArr.length)
  const goNext = () => setActiveIndex((i) => (i + 1) % imagenesArr.length)

  const titulo = config.titulo?.trim() || 'LOCALIZACIÓN'

  return (
    <section
      id="sede"
      data-section="sede"
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: TG_COLORS.paper, color: TG_COLORS.text }}
    >
      <PaperTexture opacity={0.03} blend="multiply" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel text={config.eyebrow?.trim() || 'LOCALIZACIÓN'} className="mb-10" />

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-3xl leading-tight md:text-5xl"
          style={{ ...TG_HEADER_STYLE, color: TG_COLORS.text }}
        >
          {titulo}
        </motion.h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            {imagenesArr.length === 0 ? (
              <div
                className="flex h-[50vh] w-full items-center justify-center text-xs uppercase tracking-[0.2em]"
                style={{ border: `1px solid ${TG_COLORS.border}`, fontFamily: TG_FONTS.mono, color: '#9A9078' }}
              >
                Imágenes pendientes
              </div>
            ) : (
              <div className="relative w-full">
                <button
                  type="button"
                  className="relative h-[55vh] w-full cursor-zoom-in overflow-hidden md:h-[65vh]"
                  style={{ border: `1px solid ${TG_COLORS.border}` }}
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
                      className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white transition-colors hover:bg-[#CC4B37]"
                      style={{ backgroundColor: 'rgba(26,26,26,0.85)' }}
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
                      className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white transition-colors hover:bg-[#CC4B37]"
                      style={{ backgroundColor: 'rgba(26,26,26,0.85)' }}
                      aria-label="Siguiente"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </>
                ) : null}

                {imagenesArr.length > 1 ? (
                  <div className="mt-3 flex justify-center gap-2">
                    {imagenesArr.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveIndex(i)}
                        className="h-1.5 transition-all"
                        style={{
                          width: i === activeIndex ? 24 : 6,
                          backgroundColor: i === activeIndex ? TG_COLORS.red : TG_COLORS.border,
                        }}
                        aria-label={`Foto ${i + 1}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="md:col-span-5">
            <DossierCard className="h-full">
              <p
                className="text-base leading-relaxed"
                style={{ fontFamily: TG_FONTS.body, color: '#3A3A33' }}
              >
                {config.descripcion?.trim() || 'Descripción de la sede próximamente.'}
              </p>

              <div className="mt-6 pt-5" style={{ borderTop: `1px dashed ${TG_COLORS.border}` }}>
                <p
                  className="text-[0.6rem] tracking-[0.3em]"
                  style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.olive }}
                >
                  DIRECCIÓN
                </p>
                <p
                  className="mt-2 text-sm"
                  style={{ fontFamily: TG_FONTS.mono, fontWeight: 400, color: TG_COLORS.text }}
                >
                  {config.direccion?.trim() || '—'}
                </p>
              </div>

              {config.coordenadas?.trim() ? (
                <div className="mt-5 pt-5" style={{ borderTop: `1px dashed ${TG_COLORS.border}` }}>
                  <p
                    className="text-[0.6rem] tracking-[0.3em]"
                    style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.olive }}
                  >
                    COORDENADAS
                  </p>
                  <p
                    className="mt-2 text-sm"
                    style={{ fontFamily: TG_FONTS.mono, fontWeight: 400, color: TG_COLORS.text }}
                  >
                    {config.coordenadas}
                  </p>
                </div>
              ) : null}

              {config.maps_link?.trim() ? (
                <div className="mt-6">
                  <a
                    href={config.maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-5 py-3 text-[0.65rem] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                    style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, backgroundColor: TG_COLORS.olive }}
                  >
                    Abrir en Google Maps
                  </a>
                </div>
              ) : null}
            </DossierCard>
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
