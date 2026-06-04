'use client'

import type { SponsorsConfig, SponsorLogo } from '../lib/types'
import { TG_COLORS, TG_FONTS } from './ui/theme'
import { PaperTexture } from './ui/PaperTexture'
import { SectionLabel } from './ui/SectionLabel'

export function SponsorsSection({ config }: { config: SponsorsConfig }) {
  const logos = (config.logos ?? []).filter((l) => l && (l.logo_url?.trim() || l.nombre?.trim()))
  const hasLogos = logos.length > 0
  const titulo = config.titulo?.trim() || 'PATROCINADORES'

  const half = Math.ceil(logos.length / 2)
  const row1 = logos.slice(0, half)
  const row2 = logos.slice(half)
  const finalRow1 = row1
  const finalRow2 = row2.length > 0 ? row2 : row1

  return (
    <section
      data-section="sponsors"
      className="relative w-full overflow-hidden py-16 md:py-24"
      style={{
        backgroundColor: TG_COLORS.paper,
        color: TG_COLORS.text,
        borderTop: `1px solid ${TG_COLORS.border}`,
        borderBottom: `1px solid ${TG_COLORS.border}`,
      }}
    >
      <PaperTexture opacity={0.03} blend="multiply" />

      <div className="relative z-10 mx-auto mb-10 max-w-7xl px-4 md:mb-16 md:px-8">
        <SectionLabel numero="06" nombre={titulo} />
      </div>

      {!hasLogos ? (
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p
            className="text-[0.7rem] uppercase tracking-[0.3em]"
            style={{ fontFamily: TG_FONTS.mono, color: '#9A9078' }}
          >
            Patrocinadores próximamente
          </p>
        </div>
      ) : (
        <div className="relative z-10 space-y-8 md:space-y-12">
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
        style={{ animationDuration: `${duration}s` }}
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
          animation-name: tg-marquee-left;
        }
        .marquee-right {
          animation-name: tg-marquee-right;
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }
        @keyframes tg-marquee-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes tg-marquee-right {
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
    <div className="mx-6 flex h-20 w-40 shrink-0 items-center justify-center md:mx-10 md:h-24 md:w-52">
      {logo.logo_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logo.logo_url}
          alt={logo.nombre}
          className="max-h-full max-w-full object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
        />
      ) : (
        <span
          className="text-xs uppercase tracking-[0.2em]"
          style={{ fontFamily: TG_FONTS.mono, color: '#6A6A5C' }}
        >
          {logo.nombre}
        </span>
      )}
    </div>
  )

  if (logo.link?.trim()) {
    return (
      <a href={logo.link} target="_blank" rel="noopener noreferrer" className="shrink-0">
        {content}
      </a>
    )
  }
  return <div className="shrink-0">{content}</div>
}
