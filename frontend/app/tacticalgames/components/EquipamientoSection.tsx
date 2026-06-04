'use client'

import { motion } from 'framer-motion'
import type { EquipamientoConfig, ItemEquipamiento } from '../lib/types'
import { TG_COLORS, TG_FONTS } from './ui/theme'
import { PaperTexture } from './ui/PaperTexture'
import { SectionLabel } from './ui/SectionLabel'
import { DossierCard } from './ui/DossierCard'
import { StampBadge } from './ui/StampBadge'

function normalizeItems(raw: unknown): ItemEquipamiento[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return null
      const o = row as Record<string, unknown>
      const nombre = typeof o.nombre === 'string' ? o.nombre.trim() : ''
      if (!nombre) return null
      return { nombre, obligatorio: Boolean(o.obligatorio) }
    })
    .filter((v): v is ItemEquipamiento => v !== null)
}

export function EquipamientoSection({ config }: { config: EquipamientoConfig }) {
  const items = normalizeItems(config.items)
  const obligatorios = items.filter((i) => i.obligatorio)
  const deseables = items.filter((i) => !i.obligatorio)
  const titulo = config.titulo?.trim() || 'EQUIPAMIENTO'
  const subtitulo = config.subtitulo?.trim() || 'Revisa tu equipo antes de presentarte'

  return (
    <section
      id="equipamiento"
      data-section="equipamiento"
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: TG_COLORS.paper, color: TG_COLORS.text }}
    >
      <PaperTexture opacity={0.03} blend="multiply" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-8">
        <SectionLabel numero="04" nombre={titulo} className="mb-8" />

        <h2
          className="text-3xl leading-tight md:text-5xl"
          style={{ fontFamily: TG_FONTS.header, color: TG_COLORS.text }}
        >
          {titulo}
        </h2>
        <p
          className="mt-3 text-base md:text-lg"
          style={{ fontFamily: TG_FONTS.body, color: '#3A3A33' }}
        >
          {subtitulo}
        </p>

        <DossierCard className="mt-10" delay={0.1}>
          <div className="absolute right-6 top-2 z-10">
            <StampBadge color={TG_COLORS.brass} rotate={-6}>
              VERIFICADO
            </StampBadge>
          </div>

          {items.length === 0 ? (
            <p
              className="py-6 text-sm uppercase tracking-[0.2em]"
              style={{ fontFamily: TG_FONTS.mono, color: '#9A9078' }}
            >
              Manifiesto de equipo en preparación
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
              <div>
                <p
                  className="mb-4 text-[0.7rem] tracking-[0.25em]"
                  style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.red }}
                >
                  OBLIGATORIO
                </p>
                <ul className="space-y-3">
                  {obligatorios.map((item, i) => (
                    <ChecklistItem key={i} index={i} nombre={item.nombre} obligatorio />
                  ))}
                  {obligatorios.length === 0 ? (
                    <li className="text-sm" style={{ fontFamily: TG_FONTS.body, color: '#9A9078' }}>
                      Sin items
                    </li>
                  ) : null}
                </ul>
              </div>

              <div>
                <p
                  className="mb-4 text-[0.7rem] tracking-[0.25em]"
                  style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.olive }}
                >
                  DESEABLE
                </p>
                <ul className="space-y-3">
                  {deseables.map((item, i) => (
                    <ChecklistItem key={i} index={i} nombre={item.nombre} obligatorio={false} />
                  ))}
                  {deseables.length === 0 ? (
                    <li className="text-sm" style={{ fontFamily: TG_FONTS.body, color: '#9A9078' }}>
                      Sin items
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          )}

          {(config.nota_bbs?.trim() || config.nota_extra?.trim()) ? (
            <div className="mt-8 space-y-1.5 pt-5" style={{ borderTop: `1px dashed ${TG_COLORS.border}` }}>
              {config.nota_bbs?.trim() ? (
                <p className="text-xs italic" style={{ fontFamily: TG_FONTS.mono, color: TG_COLORS.olive }}>
                  * {config.nota_bbs}
                </p>
              ) : null}
              {config.nota_extra?.trim() ? (
                <p className="text-xs italic" style={{ fontFamily: TG_FONTS.mono, color: '#6A6A5C' }}>
                  * {config.nota_extra}
                </p>
              ) : null}
            </div>
          ) : null}
        </DossierCard>
      </div>
    </section>
  )
}

function ChecklistItem({
  index,
  nombre,
  obligatorio,
}: {
  index: number
  nombre: string
  obligatorio: boolean
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="flex items-start gap-3"
    >
      {obligatorio ? (
        <span
          aria-hidden
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center"
          style={{ backgroundColor: TG_COLORS.red }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : (
        <span
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 rounded-full"
          style={{ border: `2px solid ${TG_COLORS.olive}` }}
        />
      )}
      <span
        className="text-sm md:text-base"
        style={{ fontFamily: TG_FONTS.body, fontWeight: 400, color: TG_COLORS.text }}
      >
        {nombre}
      </span>
    </motion.li>
  )
}
