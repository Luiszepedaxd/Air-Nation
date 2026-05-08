'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { SponsorsConfig, SponsorLogo } from '../lib/types'

export function SponsorsSection({ config }: { config: SponsorsConfig }) {
  const logos = config.logos ?? []
  const hasLogos = logos.length > 0

  const half = Math.ceil(logos.length / 2)
  const row1 = logos.slice(0, half)
  const row2 = logos.slice(half).length > 0 ? logos.slice(half) : row1

  return (
    <section
      data-section="sponsors"
      className="relative w-full overflow-hidden bg-[#F5F3EF] py-20 text-[#111111] md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center md:mb-20"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {config.eyebrow}
          </p>
          <h2
            className="mt-4 text-3xl leading-none md:text-5xl lg:text-6xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {config.titulo}
          </h2>
        </motion.div>
      </div>

      {!hasLogos ? (
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p
            className="text-[0.7rem] uppercase tracking-[0.3em] text-[#999999] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            Patrocinadores próximamente
          </p>
        </div>
      ) : (
        <div className="space-y-8 md:space-y-12">
          <Marquee logos={row1} direction="left" duration={40} />
          <Marquee logos={row2} direction="right" duration={55} />
        </div>
      )}

      <style jsx global>{`
        @keyframes ok2MarqueeLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes ok2MarqueeRight {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }
        .ok2-marquee-track-left {
          animation: ok2MarqueeLeft var(--ok2-marquee-dur, 40s) linear infinite;
        }
        .ok2-marquee-track-right {
          animation: ok2MarqueeRight var(--ok2-marquee-dur, 55s) linear infinite;
        }
        .ok2-marquee-container:hover .ok2-marquee-track-left,
        .ok2-marquee-container:hover .ok2-marquee-track-right {
          animation-play-state: paused;
        }
        .ok2-sponsor-cell:hover .ok2-sponsor-logo-inner {
          transform: scale(1.12);
        }
      `}</style>
    </section>
  )
}

function Marquee({
  logos,
  direction,
  duration,
}: {
  logos: SponsorLogo[]
  direction: 'left' | 'right'
  duration: number
}) {
  const items = [...logos, ...logos]
  const trackClass =
    direction === 'left' ? 'ok2-marquee-track-left' : 'ok2-marquee-track-right'

  return (
    <div
      className="ok2-marquee-container relative w-full overflow-hidden"
      style={{ '--ok2-marquee-dur': `${duration}s` } as CSSProperties}
    >
      <div className={`flex w-fit gap-12 md:gap-20 ${trackClass}`}>
        {items.map((logo, i) => (
          <SponsorLogoItem key={`${logo.nombre}-${i}`} logo={logo} />
        ))}
      </div>
    </div>
  )
}

function SponsorLogoItem({ logo }: { logo: SponsorLogo }) {
  const content = (
    <div className="flex h-20 w-40 shrink-0 items-center justify-center transition-transform duration-300 md:h-28 md:w-56 ok2-sponsor-logo-inner">
      {logo.logo_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logo.logo_url}
          alt={logo.nombre}
          className="max-h-full max-w-full object-contain opacity-80 transition-all duration-300 hover:opacity-100 ok2-sponsor-img"
        />
      ) : (
        <span
          className="text-xs uppercase tracking-[0.2em] text-[#999999]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {logo.nombre}
        </span>
      )}
    </div>
  )

  if (logo.link) {
    return (
      <a href={logo.link} target="_blank" rel="noopener noreferrer" className="ok2-sponsor-cell">
        {content}
      </a>
    )
  }
  return <div className="ok2-sponsor-cell">{content}</div>
}
