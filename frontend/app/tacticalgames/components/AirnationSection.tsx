'use client'

import { motion } from 'framer-motion'
import type { AirnationConfig } from '../lib/types'
import { TG_COLORS, TG_FONTS, TG_HEADER_STYLE } from './ui/theme'
import { SectionLabel } from './ui/SectionLabel'
import { DossierCard } from './ui/DossierCard'

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('//')
}

export function AirnationSection({ config }: { config: AirnationConfig }) {
  const ctaHref = config.cta_link?.trim() || ''
  const titulo = config.titulo?.trim() || 'PLATAFORMA OFICIAL'
  const descripcion =
    config.descripcion?.trim() ||
    'AirNation es la plataforma que conecta a la comunidad de airsoft en México.'

  return (
    <section
      data-section="airnation"
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: TG_COLORS.dark, color: '#fff' }}
    >
      <div className="relative z-10 mx-auto max-w-3xl px-4 md:px-8">
        <SectionLabel text={config.eyebrow?.trim() || 'PLATAFORMA OFICIAL'} color="#A8B271" className="mb-10" />

        <DossierCard background="#23231F" delay={0.1}>
          <div className="text-center">
            <motion.p
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl leading-none md:text-6xl"
              style={{ ...TG_HEADER_STYLE }}
            >
              <span className="text-white">AIR</span>
              <span style={{ color: TG_COLORS.red }}>NATION</span>
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mx-auto mt-6 max-w-xl text-lg leading-snug md:text-2xl"
              style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.brass }}
            >
              {titulo}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed"
              style={{ fontFamily: TG_FONTS.body, color: 'rgba(255,255,255,0.7)' }}
            >
              {descripcion}
            </motion.p>

            {ctaHref ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mt-8"
              >
                <a
                  href={ctaHref}
                  {...(isExternalHref(ctaHref) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex items-center justify-center px-7 py-3.5 text-[0.7rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
                  style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, backgroundColor: TG_COLORS.red }}
                >
                  {config.cta_texto?.trim() || 'CONOCER AIRNATION'}
                </a>
              </motion.div>
            ) : null}
          </div>
        </DossierCard>
      </div>
    </section>
  )
}
