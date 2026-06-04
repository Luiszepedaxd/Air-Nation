'use client'

import { motion } from 'framer-motion'
import type { BriefingConfig } from '../lib/types'
import { TG_COLORS, TG_FONTS } from './ui/theme'
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
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: TG_COLORS.paper, color: TG_COLORS.text }}
    >
      <PaperTexture opacity={0.03} blend="multiply" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-8">
        <SectionLabel numero="01" nombre={titulo} className="mb-10" />

        <DossierCard>
          <h2
            className="text-3xl leading-tight md:text-5xl"
            style={{ fontFamily: TG_FONTS.header, color: TG_COLORS.text }}
          >
            {titulo}
          </h2>

          {parrafos.length > 0 ? (
            <div className="mt-6 space-y-4">
              {parrafos.map((p, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="text-base leading-relaxed md:text-lg"
                  style={{ fontFamily: TG_FONTS.body, color: '#3A3A33' }}
                >
                  {p}
                </motion.p>
              ))}
            </div>
          ) : (
            <p
              className="mt-6 text-sm uppercase tracking-[0.2em]"
              style={{ fontFamily: TG_FONTS.mono, color: '#9A9078' }}
            >
              Briefing en preparación
            </p>
          )}

          {highlights.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {highlights.map((h, i) => {
                const { etiqueta, valor } = parseHighlight(h)
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.06 }}
                    className="bg-white/60 px-4 py-3"
                    style={{ borderLeft: `3px solid ${TG_COLORS.olive}` }}
                  >
                    {etiqueta ? (
                      <span
                        className="block text-[0.6rem] tracking-[0.2em]"
                        style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.olive }}
                      >
                        {etiqueta.toUpperCase()}
                      </span>
                    ) : null}
                    <span
                      className="block text-sm md:text-base"
                      style={{ fontFamily: TG_FONTS.mono, fontWeight: 400, color: TG_COLORS.text }}
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
