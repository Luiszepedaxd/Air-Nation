'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GaleriaConfig, GaleriaImagen } from '../lib/types'
import { TG_COLORS, TG_FONTS } from './ui/theme'
import { PaperTexture } from './ui/PaperTexture'
import { SectionLabel } from './ui/SectionLabel'

function orientacionClass(o: GaleriaImagen['orientacion']) {
  switch (o) {
    case 'horizontal':
      return 'aspect-[4/3]'
    case 'cuadrada':
      return 'aspect-square'
    case 'vertical':
    default:
      return 'aspect-[3/4]'
  }
}

export function GaleriaSection({ config }: { config: GaleriaConfig }) {
  const imagenes = (config.imagenes ?? []).filter((im) => im && typeof im.url === 'string' && im.url.trim())
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const titulo = config.titulo?.trim() || 'GALERÍA'

  const close = useCallback(() => setLightboxIndex(null), [])
  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % imagenes.length))
  }, [imagenes.length])
  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + imagenes.length) % imagenes.length))
  }, [imagenes.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, close, next, prev])

  useEffect(() => {
    if (lightboxIndex === null) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [lightboxIndex])

  return (
    <section
      data-section="galeria"
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: TG_COLORS.paper, color: TG_COLORS.text }}
    >
      <PaperTexture opacity={0.03} blend="multiply" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8">
        <SectionLabel numero="07" nombre={titulo} className="mb-8" />
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-3xl leading-tight md:text-5xl"
          style={{ fontFamily: TG_FONTS.header, color: TG_COLORS.text }}
        >
          {titulo}
        </motion.h2>

        {imagenes.length === 0 ? (
          <div
            className="py-16 text-center"
            style={{ border: `1px solid ${TG_COLORS.border}` }}
          >
            <p
              className="text-[0.7rem] uppercase tracking-[0.3em]"
              style={{ fontFamily: TG_FONTS.mono, color: '#9A9078' }}
            >
              Galería disponible después del evento
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden">
              <div
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {imagenes.map((img, i) => (
                  <button
                    key={`${img.url}-${i}`}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className="relative h-[60vh] w-[80vw] shrink-0 snap-center overflow-hidden"
                    style={{ border: `1px solid ${TG_COLORS.border}` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <p
                className="mt-2 text-center text-[0.55rem] tracking-[0.3em]"
                style={{ fontFamily: TG_FONTS.mono, color: '#9A9078' }}
              >
                {imagenes.length} FOTOS · DESLIZA
              </p>
            </div>

            <div className="hidden md:block">
              <div className="columns-2 gap-3 md:columns-3 md:gap-4 lg:columns-4" style={{ columnFill: 'balance' }}>
                {imagenes.map((img, i) => (
                  <GalleryItem key={`${img.url}-${i}`} img={img} index={i} onClick={() => setLightboxIndex(i)} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && imagenes[lightboxIndex] ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Vista de imagen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            onClick={close}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-white hover:text-[#CC4B37] md:right-8 md:top-8"
              aria-label="Cerrar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            {imagenes.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    prev()
                  }}
                  className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center text-white hover:text-[#CC4B37] md:left-8"
                  aria-label="Anterior"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    next()
                  }}
                  className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center text-white hover:text-[#CC4B37] md:right-8"
                  aria-label="Siguiente"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </>
            ) : null}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              src={imagenes[lightboxIndex].url}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <p
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[0.6rem] tracking-[0.3em] text-white/60"
              style={{ fontFamily: TG_FONTS.mono }}
            >
              {lightboxIndex + 1} / {imagenes.length}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

function GalleryItem({
  img,
  index,
  onClick,
}: {
  img: GaleriaImagen
  index: number
  onClick: () => void
}) {
  const aspect = orientacionClass(img.orientacion)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: (index % 8) * 0.05 }}
      className="group mb-3 block w-full overflow-hidden md:mb-4"
      style={{ breakInside: 'avoid', border: `1px solid ${TG_COLORS.border}` }}
    >
      <div className={`relative w-full ${aspect}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
    </motion.button>
  )
}
