'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import type { HeroConfig } from '../lib/types'

function RussianFlag({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const fid = `wave-r-${uid}`
  return (
    <svg
      viewBox="0 0 90 60"
      className={className}
      preserveAspectRatio="none"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
      aria-hidden
    >
      <defs>
        <filter id={fid} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.04"
            numOctaves="2"
            seed="2"
          >
            <animate
              attributeName="baseFrequency"
              dur="6s"
              values="0.02 0.04;0.025 0.05;0.02 0.04"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`}>
        <rect x="0" y="0" width="90" height="20" fill="#ffffff" />
        <rect x="0" y="20" width="90" height="20" fill="#0039A6" />
        <rect x="0" y="40" width="90" height="20" fill="#D52B1E" />
      </g>
    </svg>
  )
}

function UkrainianFlag({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const fid = `wave-u-${uid}`
  return (
    <svg
      viewBox="0 0 90 60"
      className={className}
      preserveAspectRatio="none"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }}
      aria-hidden
    >
      <defs>
        <filter id={fid} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.025 0.05"
            numOctaves="2"
            seed="5"
          >
            <animate
              attributeName="baseFrequency"
              dur="7s"
              values="0.025 0.05;0.03 0.06;0.025 0.05"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="7" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`}>
        <rect x="0" y="0" width="90" height="30" fill="#005BBB" />
        <rect x="0" y="30" width="90" height="30" fill="#FFD500" />
      </g>
    </svg>
  )
}

function SplitText({ text, delay = 0 }: { text: string; delay?: number }) {
  const letters = text.split('')
  return (
    <span aria-label={text} className="inline-block">
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
  const showFlags = config.banderas_animadas !== false
  const titulo = config.titulo || ''

  return (
    <section
      data-section="hero"
      className="hero-scope relative min-h-screen w-full overflow-hidden bg-[#0a0a0a] text-white"
    >
      {config.imagen_fondo_url ? (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.imagen_fondo_url}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: 'grayscale(0.4) brightness(0.5) contrast(1.1)' }}
          />
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
          animation: 'ok2-grain 0.6s steps(4) infinite',
        }}
      />

      {showFlags && (
        <>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 md:left-12 md:block"
          >
            <RussianFlag className="h-32 w-48 lg:h-40 lg:w-60" />
            <p
              className="mt-3 text-center text-[0.6rem] tracking-[0.3em] text-white/60"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
            >
              FACCIÓN RUSA
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 md:right-12 md:block"
          >
            <UkrainianFlag className="h-32 w-48 lg:h-40 lg:w-60" />
            <p
              className="mt-3 text-center text-[0.6rem] tracking-[0.3em] text-white/60"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
            >
              FACCIÓN UCRANIA
            </p>
          </motion.div>
        </>
      )}

      <div className="relative z-30 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[0.7rem] tracking-[0.4em] text-white/70 md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
        >
          {config.eyebrow}
        </motion.p>

        <h1
          className="mt-4 text-5xl font-black leading-[0.9] tracking-tight text-white md:mt-6 md:text-8xl lg:text-[10rem]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
        >
          <SplitText text={titulo} delay={0.4} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-6 text-[0.65rem] tracking-[0.3em] text-white/60 md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
        >
          {config.subtitulo}
        </motion.p>

        {showFlags && (
          <div className="mt-8 flex gap-6 md:hidden">
            <RussianFlag className="h-16 w-24" />
            <UkrainianFlag className="h-16 w-24" />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="mt-12 flex flex-col gap-4 md:mt-16 md:flex-row md:gap-12"
        >
          {config.cta1_link ? (
            <a
              href={config.cta1_link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-2 py-2 text-[0.7rem] tracking-[0.25em] text-white transition-colors md:text-xs"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              <span className="text-[#CC4B37]">[ </span>
              <span className="border-b border-white/0 transition-all group-hover:border-white">
                {config.cta1_texto}
              </span>
              <span className="text-[#CC4B37]"> ]</span>
            </a>
          ) : null}

          {config.cta2_link ? (
            <a
              href={config.cta2_link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-2 py-2 text-[0.7rem] tracking-[0.25em] text-white transition-colors md:text-xs"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              <span className="text-[#CC4B37]">[ </span>
              <span className="border-b border-white/0 transition-all group-hover:border-white">
                {config.cta2_texto}
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
        @keyframes ok2-grain {
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
