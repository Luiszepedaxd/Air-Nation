'use client'

import { motion } from 'framer-motion'
import type { BriefingConfig } from '../lib/types'
import { TG_COLORS, TG_FONTS, TG_HEADER_STYLE } from './ui/theme'
import { PaperTexture } from './ui/PaperTexture'
import { SectionLabel } from './ui/SectionLabel'
import { DossierCard } from './ui/DossierCard'

function parseHighlight(raw: string): { etiqueta: string; valor: string } {
  const idx = raw.indexOf(':')
  if (idx === -1) return { etiqueta: '', valor: raw.trim() }
  return {
    etiqueta: raw.slice(0, idx).trim(),
    valor: raw.slice(idx + 1).trim(),
  }
}

export function BriefingSection({ config }: { config: BriefingConfig }) {
  const parrafos = (config.parrafos ?? []).filter((p) => typeof p === 'string' && p.trim())
  const highlights = (config.highlights ?? []).filter((h) => typeof h === 'string' && h.trim())
  const titulo = config.titulo?.trim() || 'BRIEFING'

  return (
    <section
      id="briefing"
      data-section="briefing"
      className="relative w-full overflow-hidden py-16 md:py-28"
      style={{ backgroundColor: TG_COLORS.paper, color: TG_COLORS.text }}
    >
      <PaperTexture opacity={0.03} blend="multiply" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-8">
        <SectionLabel text={config.eyebrow?.trim() || 'BRIEFING'} className="mb-8" />

        <DossierCard padding="p-6 md:p-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl leading-tight md:text-5xl"
            style={{ ...TG_HEADER_STYLE, color: TG_COLORS.text }}
          >
            {titulo}
          </motion.h2>

          {parrafos.length > 0 ? (
            <div className="mt-5 flex flex-col gap-4">
              {parrafos.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="text-[0.95rem] leading-relaxed md:text-lg"
                  style={{ fontFamily: TG_FONTS.body, color: '#3A3A33' }}
                >
                  {p}
                </motion.p>
              ))}
            </div>
          ) : (
            <p
              className="mt-5 text-sm uppercase tracking-[0.2em]"
              style={{ fontFamily: TG_FONTS.mono, color: '#9A9078' }}
            >
              Briefing en preparación
            </p>
          )}

          {highlights.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3">
              {highlights.map((h, i) => {
                const { etiqueta, valor } = parseHighlight(h)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="bg-white/60 px-3 py-2"
                    style={{ borderLeft: `3px solid ${TG_COLORS.olive}` }}
                  >
                    {etiqueta ? (
                      <span
                        className="block text-[0.6rem] tracking-[0.15em]"
                        style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.olive }}
                      >
                        {etiqueta.toUpperCase()}
                      </span>
                    ) : null}
                    <span
                      className="block text-[0.85rem] leading-snug"
                      style={{ fontFamily: TG_FONTS.body, color: TG_COLORS.text }}
                    >
                      {valor}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          ) : null}
        </DossierCard>
      </div>
    </section>
  )
}
