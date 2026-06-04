'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { CountdownConfig } from '../lib/types'
import { TG_COLORS, TG_FONTS, TG_HEADER_STYLE } from './ui/theme'
import { CornerBrackets } from './ui/CornerBrackets'

function calcRemaining(targetIso: string) {
  const target = new Date(targetIso).getTime()
  if (!Number.isFinite(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false, valid: false }
  }
  const now = Date.now()
  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds, expired: diff === 0, valid: true }
}

export function CountdownSection({ config }: { config: CountdownConfig }) {
  const [time, setTime] = useState(() => calcRemaining(config.fecha_inicio))

  useEffect(() => {
    setTime(calcRemaining(config.fecha_inicio))
    const id = setInterval(() => {
      setTime(calcRemaining(config.fecha_inicio))
    }, 1000)
    return () => clearInterval(id)
  }, [config.fecha_inicio])

  const pad = (n: number) => String(n).padStart(2, '0')
  const daysStr = time.days >= 100 ? String(time.days).padStart(3, '0') : pad(time.days)
  const eyebrow = config.eyebrow?.trim() || 'CUENTA REGRESIVA // INICIO DE OPERACIÓN'

  return (
    <section
      data-section="countdown"
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ backgroundColor: TG_COLORS.dark, color: '#fff' }}
    >
      {/* Scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,255,65,0.4) 0px, rgba(0,255,65,0.4) 1px, transparent 1px, transparent 4px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[0.6rem] tracking-[0.35em] md:text-xs"
          style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, color: TG_COLORS.olive }}
        >
          {eyebrow.toUpperCase()}
        </motion.p>

        {time.expired ? (
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-3xl md:text-5xl"
            style={{ ...TG_HEADER_STYLE, color: TG_COLORS.terminalGreen }}
          >
            OPERACIÓN EN CURSO
          </motion.h2>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-12"
          >
            <CornerBrackets color={TG_COLORS.terminalGreen} size={18} thickness={2} className="inline-block px-6 py-6 md:px-12 md:py-8">
              <div className="flex flex-nowrap items-start justify-center gap-2 sm:gap-4 md:gap-8">
                <Unit value={daysStr} label="DÍAS" />
                <Colon />
                <Unit value={pad(time.hours)} label="HORAS" />
                <Colon />
                <Unit value={pad(time.minutes)} label="MIN" />
                <Colon />
                <Unit value={pad(time.seconds)} label="SEG" tick />
              </div>
            </CornerBrackets>
          </motion.div>
        )}
      </div>
    </section>
  )
}

function Unit({ value, label, tick }: { value: string; label: string; tick?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <motion.span
        key={tick ? value : undefined}
        initial={tick ? { opacity: 0.5, scale: 0.96 } : false}
        animate={tick ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.25 }}
        className="tabular-nums leading-none"
        style={{
          fontFamily: TG_FONTS.mono,
          fontWeight: 700,
          color: TG_COLORS.terminalGreen,
          fontSize: 'clamp(1.8rem, 9vw, 5rem)',
          textShadow: '0 0 12px rgba(0,255,65,0.5)',
        }}
      >
        {value}
      </motion.span>
      <span
        className="mt-2 text-[0.5rem] tracking-[0.3em] md:text-[0.65rem]"
        style={{ fontFamily: TG_FONTS.mono, fontWeight: 400, color: TG_COLORS.olive }}
      >
        {label}
      </span>
    </div>
  )
}

function Colon() {
  return (
    <span
      className="leading-none"
      style={{
        fontFamily: TG_FONTS.mono,
        fontWeight: 700,
        color: 'rgba(0,255,65,0.4)',
        fontSize: 'clamp(1.8rem, 9vw, 5rem)',
      }}
    >
      :
    </span>
  )
}
