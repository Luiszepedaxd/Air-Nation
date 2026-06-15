'use client'

import type { SponsorsConfig, SponsorLogo } from '../lib/types'
import { TG_COLORS, TG_FONTS } from './ui/theme'
import { PaperTexture } from './ui/PaperTexture'
import { SectionLabel } from './ui/SectionLabel'

export function SponsorsSection({ config }: { config: SponsorsConfig }) {
  const logos = (config.logos ?? []).filter((l) => l && (l.logo_url?.trim() || l.nombre?.trim()))
  const hasLogos = logos.length > 0
  const singleRow = logos.length < 6

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
        <SectionLabel text={config.eyebrow?.trim() || 'PATROCINADORES'} />
      </div>

      {!hasLogos ? (
        <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
          <p
            className="text-[0.7rem] uppercase tracking-[0.3em]"
            style={{ fontFamily: TG_FONTS.mono, color: '#9A9078' }}
          >
            Patrocinadores por confirmar
          </p>
        </div>
      ) : (
        <div
          className={`relative z-10 mx-auto flex max-w-5xl items-center justify-center gap-6 px-4 md:gap-8 md:px-8 ${
            singleRow ? 'flex-nowrap' : 'flex-wrap'
          }`}
        >
          {logos.map((logo, i) => (
            <SponsorLogoItem key={`${logo.nombre}-${i}`} logo={logo} />
          ))}
        </div>
      )}
    </section>
  )
}

function SponsorLogoItem({ logo }: { logo: SponsorLogo }) {
  const content = (
    <div className="flex shrink-0 items-center justify-center">
      {logo.logo_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logo.logo_url}
          alt={logo.nombre}
          className="h-[45px] w-auto max-w-[140px] object-contain opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:h-[60px] md:max-w-[180px]"
        />
      ) : (
        <span
          className="text-xs uppercase tracking-[0.2em] opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
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
