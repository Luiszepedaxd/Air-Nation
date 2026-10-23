'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import type { HeroConfig } from '../lib/types'
import { BH2_HAZARD_STRIPE, BH2_HEADER_STYLE } from '../lib/theme'
import { propsEnlace } from '../lib/enlaces'
import { usePausaVideoFueraDeVista } from '../hooks/usePausaVideoFueraDeVista'

function WordSplit({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(/\s+/).filter(Boolean)

  return (
    <span aria-label={text} className="inline-block max-w-full">
      {words.map((word, i) => (
        <span key={`${i}-${word}`} className="inline-block whitespace-nowrap">
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: delay + i * 0.12, ease: 'easeOut' }}
            className="inline-block"
            aria-hidden
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? <span aria-hidden>{'\u00A0'}</span> : null}
        </span>
      ))}
    </span>
  )
}

function Cta({
  href,
  texto,
  solido,
}: {
  href: string
  texto: string
  solido: boolean
}) {
  return (
    <a
      href={href}
      {...propsEnlace(href)}
      className={
        solido
          ? 'inline-flex items-center justify-center bg-[#CC4B37] px-6 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90'
          : 'inline-flex items-center justify-center border border-white px-6 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-[#111111]'
      }
      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, borderRadius: 2 }}
    >
      {texto}
    </a>
  )
}

export function HeroSection({ config }: { config: HeroConfig }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  usePausaVideoFueraDeVista(videoRef, { reanudarAlVolver: true })

  const eyebrow = config.eyebrow?.trim() || 'SPEAR AIRSOFT PRODUCTIONS PRESENTA'
  const titulo = config.titulo?.trim() || 'BIOHAZARD 2'
  const subtitulo = config.subtitulo?.trim() || 'DÍA CERO'
  const lema = config.lema?.trim() || 'Táctica. Supervivencia. Infección. Cumple a tu país.'
  const fecha = config.fecha_texto?.trim() || '14 Y 15 DE NOVIEMBRE 2026'
  const ubicacion = config.ubicacion_texto?.trim() || 'SELVA OJO DE HALCÓN'
  const mediaUrl = config.media_url?.trim() || ''
  const mediaType = config.media_type === 'video' ? 'video' : 'image'
  const cta1 = config.cta1_link?.trim() || ''
  const cta2 = config.cta2_link?.trim() || ''

  return (
    <section
      data-section="hero"
      className="relative min-h-[70vh] w-full overflow-hidden bg-[#141A10] text-white md:min-h-screen"
    >
      {mediaUrl ? (
        <div className="absolute inset-0 z-0">
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full min-h-[70vh] w-full object-cover md:min-h-screen"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt=""
              className="h-full min-h-[70vh] w-full object-cover md:min-h-screen"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#141A10]" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-[#141A10] to-[#141A10]" />
      )}

      <div className="relative z-30 flex min-h-[70vh] flex-col items-center justify-center px-4 pb-16 pt-24 text-center md:min-h-screen md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-[0.62rem] tracking-[0.35em] text-[#F2B705] sm:text-[0.7rem]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {eyebrow}
        </motion.p>

        <h1
          className="mx-auto mt-4 w-full max-w-5xl font-black leading-[0.9] text-white"
          style={{
            ...BH2_HEADER_STYLE,
            fontSize: 'clamp(2.6rem, 13vw, 8.5rem)',
          }}
        >
          <WordSplit text={titulo} delay={0.3} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-4 text-2xl text-[#F2B705] sm:text-4xl md:text-6xl"
          style={BH2_HEADER_STYLE}
        >
          {subtitulo}
        </motion.p>

        {fecha || ubicacion ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.15 }}
            className="mt-6 max-w-xl text-[0.68rem] uppercase tracking-[0.22em] text-white/85 sm:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {fecha}
            {fecha && ubicacion ? ' · ' : ''}
            {ubicacion}
          </motion.p>
        ) : null}

        {lema ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.3 }}
            className="mt-4 max-w-lg text-sm italic text-white/75 md:text-base"
            style={{ fontFamily: 'Lato, sans-serif' }}
          >
            {lema}
          </motion.p>
        ) : null}

        {cta1 || cta2 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center"
          >
            {cta1 ? (
              <Cta href={cta1} texto={config.cta1_texto?.trim() || 'INSCRIBIRME'} solido />
            ) : null}
            {cta2 ? (
              <Cta href={cta2} texto={config.cta2_texto?.trim() || 'VER FACCIONES'} solido={false} />
            ) : null}
          </motion.div>
        ) : null}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-40 h-1.5"
        style={{ background: BH2_HAZARD_STRIPE }}
        aria-hidden
      />
    </section>
  )
}
