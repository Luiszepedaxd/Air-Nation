'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { OperativoConfig, OperativoHito } from '../lib/types'

export function OperativoSection({ config }: { config: OperativoConfig }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const pathLength = useTransform(scrollYProgress, [0.1, 0.9], [0, 1])

  const [timestamp, setTimestamp] = useState('')
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const d = new Date()
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const mm = String(d.getUTCMinutes()).padStart(2, '0')
      const ss = String(d.getUTCSeconds()).padStart(2, '0')
      setTimestamp(`${hh}:${mm}:${ss} UTC`)
    }
    updateTime()
    const id = setInterval(updateTime, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const triggerGlitch = () => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 120)
    }
    const id = setInterval(() => {
      if (Math.random() > 0.4) triggerGlitch()
    }, 6000)
    return () => clearInterval(id)
  }, [])

  const hitos = config.hitos ?? []

  return (
    <section
      id="operativo"
      data-section="operativo"
      className="relative w-full overflow-hidden bg-[#0d1117] py-16 text-white md:py-24"
    >
      <style jsx global>{`
        @keyframes ok2-radar {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#CC4B37]/30 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col gap-3 border-b border-[#CC4B37]/30 pb-4 md:mb-16 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 animate-pulse bg-[#CC4B37]" />
            <p
              className="text-[0.65rem] tracking-[0.3em] text-[#CC4B37] md:text-[0.7rem]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              {config.eyebrow} · 04–05 JUL 2026 · STATUS: PENDING
            </p>
          </div>
          <p
            className={`text-[0.7rem] tabular-nums text-white/60 transition-transform md:text-xs ${
              glitch ? 'translate-x-[2px]' : ''
            }`}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontWeight: 500,
            }}
          >
            T+ {timestamp}
          </p>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-4xl leading-none md:mb-20 md:text-7xl lg:text-8xl"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, letterSpacing: '-0.02em' }}
        >
          {config.titulo}
        </motion.h2>

        <div ref={ref} className="relative">
          <div className="absolute left-[27px] top-0 h-full w-px bg-white/10 md:left-[91px]" />

          <motion.div
            aria-hidden
            className="absolute left-[27px] top-0 w-px overflow-hidden md:left-[91px]"
            style={{ height: '100%' }}
          >
            <motion.div
              className="absolute left-0 h-24 w-px bg-gradient-to-b from-transparent via-[#CC4B37] to-transparent"
              animate={{ top: ['-10%', '110%'] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>

          <motion.div
            className="absolute left-[27px] top-0 w-px origin-top bg-[#CC4B37] md:left-[91px]"
            style={{ scaleY: pathLength, height: '100%' }}
          />

          <div className="space-y-10 md:space-y-14">
            {hitos.map((hito, i) => (
              <HitoRow key={`${hito.hora}-${hito.titulo}-${i}`} hito={hito} index={i} />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 flex flex-col gap-3 border-t border-[#CC4B37]/30 pt-4 md:mt-16 md:flex-row md:items-center md:justify-between"
        >
          <p
            className="text-[0.65rem] tracking-[0.3em] text-white/60 md:text-[0.7rem]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {String(hitos.length).padStart(2, '0')} / {String(hitos.length).padStart(2, '0')} OBJECTIVES
          </p>
          <p
            className="text-[0.65rem] tracking-[0.3em] text-white/60 md:text-[0.7rem]"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            MISNÉBALAM · SECTOR 7
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function HitoRow({ hito, index }: { hito: OperativoHito; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [typed, setTyped] = useState('')
  const [started, setStarted] = useState(false)

  const pulseColor = hito.nocturno ? '#4a8ec2' : '#CC4B37'

  useEffect(() => {
    if (!rowRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true)
          }
        })
      },
      { threshold: 0.5 }
    )
    observer.observe(rowRef.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setTyped(hito.titulo.slice(0, i))
      if (i >= hito.titulo.length) clearInterval(interval)
    }, 25)
    return () => clearInterval(interval)
  }, [started, hito.titulo])

  const unidadLabel = hito.unidad?.trim()

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="relative grid grid-cols-[56px_1fr] items-start gap-3 md:grid-cols-[120px_1fr] md:gap-8"
    >
      <div className="relative">
        <div className="relative flex h-12 items-center justify-center md:h-14">
          {started ? (
            <>
              <span
                className="absolute h-6 w-6 rounded-full opacity-0"
                style={{
                  border: `1px solid ${pulseColor}`,
                  animation: 'ok2-radar 2.5s ease-out infinite',
                }}
              />
              <span
                className="absolute h-6 w-6 rounded-full opacity-0"
                style={{
                  border: `1px solid ${pulseColor}`,
                  animation: 'ok2-radar 2.5s ease-out infinite 0.8s',
                }}
              />
            </>
          ) : null}
          <span
            className="relative z-10 h-3 w-3 rounded-full"
            style={{
              backgroundColor: pulseColor,
              boxShadow: `0 0 12px ${pulseColor}`,
            }}
          />
        </div>

        <p
          className="mt-2 text-base text-white tabular-nums md:text-3xl"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontWeight: 700,
          }}
        >
          {hito.hora}
        </p>
      </div>

      <div className="pt-2 md:pt-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3
            className="text-lg uppercase text-white md:text-2xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            {typed}
            {started && typed.length < hito.titulo.length ? (
              <span
                className="ml-0.5 inline-block h-4 w-[2px] animate-pulse align-middle md:h-6"
                style={{ backgroundColor: pulseColor }}
              />
            ) : null}
          </h3>
          {unidadLabel ? (
            <span
              className="border border-white/20 bg-white/5 px-2 py-0.5 text-[0.55rem] tracking-[0.18em] text-white/70 md:text-[0.65rem]"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontWeight: 600,
              }}
            >
              [ {unidadLabel} ]
            </span>
          ) : null}
        </div>

        {hito.descripcion ? (
          <p
            className="mt-2 text-sm text-white/60 md:text-base"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 400 }}
          >
            {hito.descripcion}
          </p>
        ) : null}

        {hito.nocturno ? (
          <p
            className="mt-2 text-[0.55rem] uppercase tracking-[0.25em] md:text-[0.6rem]"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: pulseColor,
              fontWeight: 600,
            }}
          >
            ● NIGHT OPS
          </p>
        ) : null}
      </div>
    </motion.div>
  )
}
