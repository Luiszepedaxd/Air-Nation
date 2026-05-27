'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { CountdownConfig } from '../lib/types'

function FlipDigit({ value }: { value: string }) {
  return (
    <div className="relative inline-block [perspective:420px]" style={{ transformStyle: 'preserve-3d' }}>
      <motion.span
        key={value}
        initial={{ rotateX: -85, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="inline-block tabular-nums"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontWeight: 700,
          transformOrigin: 'center center',
          display: 'inline-block',
          backfaceVisibility: 'hidden',
        }}
      >
        {value}
      </motion.span>
    </div>
  )
}

function calcRemaining(targetIso: string) {
  const target = new Date(targetIso).getTime()
  if (!Number.isFinite(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false }
  }
  const now = Date.now()
  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds, expired: diff === 0 }
}

export function CountdownSection({ config }: { config: CountdownConfig }) {
  const fechaInicio = config.fecha_inicio?.trim() || '2026-10-10T08:00:00-06:00'
  const [time, setTime] = useState(() => calcRemaining(fechaInicio))
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setTime(calcRemaining(fechaInicio))
      setPulse((p) => !p)
    }, 1000)
    return () => clearInterval(id)
  }, [fechaInicio])

  const pad = (n: number) => String(n).padStart(2, '0')
  const daysStr = time.days >= 100 ? String(time.days).padStart(3, '0') : pad(time.days)
  const eyebrow = config.eyebrow?.trim() || 'FALTAN PARA EL DESPLIEGUE'

  return (
    <section
      data-section="countdown"
      className="relative w-full overflow-hidden bg-[#F5F3EF] py-16 text-[#111111] md:py-40"
    >
      <div className="mx-auto max-w-6xl px-4 text-center md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {eyebrow}
        </motion.p>

        {time.expired ? (
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-4xl text-[#111111] md:text-7xl"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
          >
            EL OPERATIVO HA INICIADO
          </motion.h2>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-12 md:mt-16"
          >
            <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-3 md:gap-8">
              <Unit value={daysStr} label="DÍAS" />
              <Separator pulse={pulse} />
              <Unit value={pad(time.hours)} label="HRS" />
              <Separator pulse={pulse} />
              <Unit value={pad(time.minutes)} label="MIN" />
              <Separator pulse={pulse} />
              <Unit value={pad(time.seconds)} label="SEG" />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex">
        {value.split('').map((char, i) => (
          <span
            key={`${label}-dig-${i}`}
            className="inline-flex h-12 w-7 items-center justify-center border border-[#E5E0DA] bg-[#FFFFFF] text-xl text-[#111111] shadow-inner sm:h-14 sm:w-9 sm:text-2xl md:h-28 md:w-20 md:text-6xl lg:h-32 lg:w-24 lg:text-7xl"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            <FlipDigit value={char} />
          </span>
        ))}
      </div>
      <p
        className="mt-2 text-[0.55rem] tracking-[0.4em] text-[#666666] md:mt-3 md:text-[0.65rem]"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
      >
        {label}
      </p>
    </div>
  )
}

function Separator({ pulse }: { pulse: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center pb-4 md:pb-9">
      <div
        className="h-1.5 w-1.5 rounded-full transition-colors duration-500 md:h-2 md:w-2"
        style={{ backgroundColor: pulse ? '#CC4B37' : 'rgba(204,75,55,0.3)' }}
      />
      <div
        className="mt-1.5 h-1.5 w-1.5 rounded-full transition-colors duration-500 md:mt-2 md:h-2 md:w-2"
        style={{ backgroundColor: pulse ? '#CC4B37' : 'rgba(204,75,55,0.3)' }}
      />
    </div>
  )
}
