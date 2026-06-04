'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { EquipamientoConfig, EquipamientoTab, ItemEquipamiento } from '../lib/types'
import { TG_COLORS, TG_FONTS, TG_HEADER_STYLE } from './ui/theme'
import { PaperTexture } from './ui/PaperTexture'
import { SectionLabel } from './ui/SectionLabel'
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

function normalizeTabs(raw: unknown): EquipamientoTab[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return null
      const o = row as Record<string, unknown>
      const nombre = typeof o.nombre === 'string' ? o.nombre.trim() : ''
      const items = normalizeItems(o.items)
      if (!nombre && items.length === 0) return null
      return { nombre: nombre || 'CATEGORÍA', items }
    })
    .filter((v): v is EquipamientoTab => v !== null)
}

export function EquipamientoSection({ config }: { config: EquipamientoConfig }) {
  const tabs = normalizeTabs(config.tabs)
  const titulo = config.titulo?.trim() || 'EQUIPAMIENTO'
  const subtitulo = config.subtitulo?.trim() || 'Revisa tu equipo antes de presentarte'
  const [activeIndex, setActiveIndex] = useState(0)

  const safeIndex = Math.min(activeIndex, Math.max(0, tabs.length - 1))
  const activeTab = tabs[safeIndex]

  return (
    <section
      id="equipamiento"
      data-section="equipamiento"
      className="relative w-full overflow-hidden py-16 md:py-28"
      style={{ backgroundColor: TG_COLORS.paper, color: TG_COLORS.text }}
    >
      <PaperTexture opacity={0.03} blend="multiply" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-8">
        <SectionLabel text={config.eyebrow?.trim() || 'EQUIPAMIENTO'} className="mb-8" />

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl leading-tight md:text-5xl"
          style={{ ...TG_HEADER_STYLE, color: TG_COLORS.text }}
        >
          {titulo}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 text-base md:text-lg"
          style={{ fontFamily: TG_FONTS.body, color: '#3A3A33' }}
        >
          {subtitulo}
        </motion.p>

        {tabs.length === 0 ? (
          <p
            className="mt-10 py-6 text-sm uppercase tracking-[0.2em]"
            style={{ fontFamily: TG_FONTS.mono, color: '#9A9078' }}
          >
            Manifiesto de equipo en preparación
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-8 md:mt-10"
          >
            {/* Pestañas tipo carpeta */}
            <div className="relative z-10 flex flex-wrap gap-1 px-1 md:gap-1.5 md:px-3">
              {tabs.map((tab, i) => {
                const isActive = i === safeIndex
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className="relative -mb-px max-w-full border border-b-0 px-3 py-2 text-left transition-colors md:px-5 md:py-2.5"
                    style={{
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                      borderColor: TG_COLORS.border,
                      backgroundColor: isActive ? TG_COLORS.paper : '#E5E0D6',
                      borderTop: isActive ? `3px solid ${TG_COLORS.red}` : `1px solid ${TG_COLORS.border}`,
                      zIndex: isActive ? 20 : 10,
                    }}
                  >
                    <span
                      className="block break-words text-[0.6rem] uppercase tracking-[0.12em] md:text-[0.7rem]"
                      style={{
                        fontFamily: TG_FONTS.mono,
                        fontWeight: 700,
                        color: isActive ? TG_COLORS.text : '#666666',
                      }}
                    >
                      {tab.nombre}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Contenido del tab activo */}
            <div
              className="relative"
              style={{
                backgroundColor: TG_COLORS.paper,
                border: `1px solid ${TG_COLORS.border}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              <div className="absolute right-4 top-3 z-10 md:right-6">
                <StampBadge color={TG_COLORS.brass} rotate={-6}>
                  VERIFICADO
                </StampBadge>
              </div>

              <div className="relative px-5 py-8 md:px-8 md:py-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={safeIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(activeTab?.items ?? []).map((item, i) => (
                        <ChecklistItem key={`${safeIndex}-${i}`} index={i} nombre={item.nombre} obligatorio={item.obligatorio} />
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {(config.nota_bbs?.trim() || config.nota_extra?.trim()) ? (
          <div className="mt-6 space-y-1.5">
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
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
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
