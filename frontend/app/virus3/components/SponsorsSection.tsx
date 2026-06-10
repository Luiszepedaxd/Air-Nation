'use client'

import { motion } from 'framer-motion'
import type { SponsorsConfig, SponsorLogo } from '../lib/types'

export function SponsorsSection({ config }: { config: SponsorsConfig }) {
  const logos = config.logos ?? []
  const hasLogos = logos.length > 0
  const eyebrow = config.eyebrow?.trim() || 'ALIADOS'
  const titulo = config.titulo?.trim() || 'PATROCINADORES'

  const half = Math.ceil(logos.length / 2)
  const row1 = logos.slice(0, half)
  const row2 = logos.slice(half)
  const finalRow1 = row1
  const finalRow2 = row2.length > 0 ? row2 : row1

  return (
    <section
      data-section="sponsors"
      className="relative w-full overflow-hidden bg-[#FFFFFF] py-20 text-[#111111] md:py-28"
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
            {eyebrow}
          </p>
          <h2
            className="mt-4 text-3xl leading-none md:text-5xl lg:text-6xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {titulo}
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
          <Marquee logos={finalRow1} direction="left" duration={40} />
          <Marquee logos={finalRow2} direction="right" duration={55} />
        </div>
      )}
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

  return (
    <div className="marquee-container relative w-full overflow-hidden">
      <div
        className={`marquee-track flex shrink-0 marquee-${direction}`}
        style={{
          animationDuration: `${duration}s`,
        }}
      >
        {items.map((logo, i) => (
          <SponsorLogoItem key={`${logo.nombre}-${i}`} logo={logo} />
        ))}
      </div>
      <style jsx>{`
        .marquee-track {
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          width: max-content;
        }
        .marquee-left {
          animation-name: marquee-left;
        }
        .marquee-right {
          animation-name: marquee-right;
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes marquee-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-right {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

function SponsorLogoItem({ logo }: { logo: SponsorLogo }) {
  const content = (
    <div className="mx-6 flex h-20 w-40 shrink-0 items-center justify-center md:mx-10 md:h-28 md:w-56">
      {logo.logo_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logo.logo_url}
          alt={logo.nombre}
          className="max-h-full max-w-full object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
        />
      ) : (
        <span
          className="text-xs uppercase tracking-[0.2em] text-[#999]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {logo.nombre}
        </span>
      )}
    </div>
  )

  if (logo.link) {
    return (
      <a href={logo.link} target="_blank" rel="noopener noreferrer" className="shrink-0">
        {content}
      </a>
    )
  }
  return <div className="shrink-0">{content}</div>
}
