'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import type { CtaFinalConfig } from '../lib/types'

function FlagPair() {
  const safeR = useId().replace(/:/g, '')
  const safeU = useId().replace(/:/g, '')
  const idR = `wave-r-cta-${safeR}`
  const idU = `wave-u-cta-${safeU}`

  return (
    <div className="flex items-center justify-center gap-6 md:gap-10">
      <svg
        viewBox="0 0 60 40"
        className="h-10 w-16 md:h-14 md:w-24"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter id={idR} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.025 0.05"
              numOctaves="2"
              seed="2"
            >
              <animate
                attributeName="baseFrequency"
                dur="6s"
                values="0.025 0.05;0.03 0.06;0.025 0.05"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
        </defs>
        <g filter={`url(#${idR})`}>
          <rect x="0" y="0" width="60" height="13.33" fill="#ffffff" />
          <rect x="0" y="13.33" width="60" height="13.33" fill="#0039A6" />
          <rect x="0" y="26.66" width="60" height="13.33" fill="#D52B1E" />
        </g>
      </svg>
      <svg
        viewBox="0 0 60 40"
        className="h-10 w-16 md:h-14 md:w-24"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter id={idU} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.06"
              numOctaves="2"
              seed="5"
            >
              <animate
                attributeName="baseFrequency"
                dur="7s"
                values="0.03 0.06;0.035 0.07;0.03 0.06"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="5" />
          </filter>
        </defs>
        <g filter={`url(#${idU})`}>
          <rect x="0" y="0" width="60" height="20" fill="#005BBB" />
          <rect x="0" y="20" width="60" height="20" fill="#FFD500" />
        </g>
      </svg>
    </div>
  )
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('//')
}

function FinalCTA({ texto, link }: { texto: string; link: string }) {
  const ext = isExternalHref(link)
  return (
    <a
      href={link}
      {...(ext ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {})}
      className="group relative w-full max-w-xs overflow-hidden border-2 border-white px-8 py-4 text-center text-[0.7rem] uppercase tracking-[0.25em] text-white transition-colors hover:text-black md:w-auto md:min-w-[260px]"
      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
    >
      <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white transition-transform duration-500 ease-out group-hover:scale-x-100" />
      <span className="relative">{texto}</span>
    </a>
  )
}

export function CtaFinalSection({ config }: { config: CtaFinalConfig }) {
  const lineas = [config.linea1, config.linea2, config.linea3].filter(Boolean)

  return (
    <section
      data-section="cta_final"
      className="relative w-full overflow-hidden bg-black py-24 text-white md:py-40"
    >
      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 md:mb-16"
        >
          <FlagPair />
        </motion.div>

        <div className="space-y-3 md:space-y-5">
          {lineas.map((linea, i) => (
            <motion.p
              key={`${i}-${linea.slice(0, 32)}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.4, ease: 'easeOut' }}
              className={`text-2xl leading-tight md:text-4xl lg:text-5xl ${
                i === lineas.length - 1 ? 'text-white' : 'text-white/60'
              }`}
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              {linea}
            </motion.p>
          ))}
        </div>

        {config.cta_titulo ? (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 1.6 }}
            className="mt-16 text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:mt-24 md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {config.cta_titulo}
          </motion.p>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 1.8 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6"
        >
          {config.cta1_link ? (
            <FinalCTA texto={config.cta1_texto} link={config.cta1_link} />
          ) : null}
          {config.cta2_link ? (
            <FinalCTA texto={config.cta2_texto} link={config.cta2_link} />
          ) : null}
        </motion.div>
      </div>

      <div className="mt-20 border-t border-white/10 md:mt-32">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center md:px-8 md:py-8">
          <p
            className="text-[0.55rem] tracking-[0.4em] text-white/30"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            OPERACIÓN KURSK II · TOLOKS CLUB AIRSOFT · 2026
          </p>
        </div>
      </div>
    </section>
  )
}
