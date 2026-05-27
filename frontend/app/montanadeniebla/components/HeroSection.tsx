'use client'

import { motion } from 'framer-motion'
import type { HeroConfig } from '../lib/types'

function SplitText({ text, delay = 0 }: { text: string; delay?: number }) {
  const display = text.trim() || 'MONTAÑA DE NIEBLA'
  const letters = display.split('')
  return (
    <span aria-label={display} className="inline-block">
      {letters.map((letter, i) => (
        <motion.span
          key={`${i}-${letter}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.04, ease: 'easeOut' }}
          className="inline-block"
          aria-hidden
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  )
}

export function HeroSection({ config }: { config: HeroConfig }) {
  const eyebrow = config.eyebrow?.trim() || 'OPERACIÓN'
  const subtitulo = config.subtitulo?.trim() || 'VII · REPRESALIAS'
  const simbolos = (config.simbolos ?? []).filter((s) => typeof s === 'string' && s.trim())
  const mediaUrl = config.media_url?.trim() || ''
  const mediaType = config.media_type === 'video' ? 'video' : 'image'

  return (
    <section
      data-section="hero"
      className="hero-scope relative min-h-[70vh] w-full overflow-hidden bg-[#0a0a0a] text-white md:min-h-screen"
    >
      {mediaUrl ? (
        <div className="absolute inset-0 z-0 min-h-[70vh] md:min-h-screen">
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="h-full min-h-[70vh] w-full object-cover object-center md:min-h-screen"
              style={{ filter: 'grayscale(0.4) brightness(0.5) contrast(1.1)' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt=""
              className="h-full min-h-[70vh] w-full object-cover object-center md:min-h-screen"
              style={{ filter: 'grayscale(0.4) brightness(0.5) contrast(1.1)' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1a1a1a] via-[#0a0a0a] to-black" />
      )}

      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.9\' numOctaves=\'3\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
          animation: 'mdn-grain 0.6s steps(4) infinite',
        }}
      />

      <div className="relative z-30 flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center md:min-h-screen md:py-0">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[0.7rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {eyebrow}
        </motion.p>

        {simbolos.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4"
          >
            {simbolos.map((sym, i) => (
              <motion.span
                key={`${i}-${sym}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.12 }}
                className="inline-flex h-10 w-10 items-center justify-center border border-white/20 bg-black/40 text-lg backdrop-blur-sm md:h-12 md:w-12 md:text-xl"
                style={{ borderRadius: 2 }}
              >
                {sym.trim()}
              </motion.span>
            ))}
          </motion.div>
        ) : null}

        <h1
          className="mt-4 text-4xl font-black leading-[0.9] tracking-tight text-white sm:text-5xl md:mt-6 md:text-8xl lg:text-[10rem]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
        >
          <SplitText text={config.titulo ?? ''} delay={0.4} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-6 text-[0.65rem] tracking-[0.3em] text-white/60 md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
        >
          {subtitulo}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="mt-12 flex flex-col gap-4 md:mt-16 md:flex-row md:gap-12"
        >
          {config.cta1_link?.trim() ? (
            <a
              href={config.cta1_link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-2 py-2 text-[0.7rem] tracking-[0.25em] text-white transition-colors md:text-xs"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              <span className="text-[#CC4B37]">[ </span>
              <span className="border-b border-white/0 transition-all group-hover:border-white">
                {config.cta1_texto?.trim() || 'REGISTRARME'}
              </span>
              <span className="text-[#CC4B37]"> ]</span>
            </a>
          ) : null}

          {config.cta2_link?.trim() ? (
            <a
              href={config.cta2_link}
              className="group relative px-2 py-2 text-[0.7rem] tracking-[0.25em] text-white transition-colors md:text-xs"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              <span className="text-[#CC4B37]">[ </span>
              <span className="border-b border-white/0 transition-all group-hover:border-white">
                {config.cta2_texto?.trim() || 'VER FACCIONES'}
              </span>
              <span className="text-[#CC4B37]"> ]</span>
            </a>
          ) : null}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2"
      >
        <div
          className="text-[0.55rem] tracking-[0.4em] text-white/50"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
        >
          SCROLL
        </div>
        <div className="mx-auto mt-2 h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
      </motion.div>

      <style jsx global>{`
        @keyframes mdn-grain {
          0%,
          100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(-2%, -2%);
          }
          50% {
            transform: translate(2%, 1%);
          }
          75% {
            transform: translate(-1%, 2%);
          }
        }
        .hero-scope {
          cursor: auto;
        }
        @media (min-width: 768px) {
          .hero-scope {
            cursor: crosshair;
          }
        }
      `}</style>
    </section>
  )
}
