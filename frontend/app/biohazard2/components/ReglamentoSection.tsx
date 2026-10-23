'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { ReglamentoConfig } from '../lib/types'
import { BH2_HEADER_STYLE } from '../lib/theme'

export function ReglamentoSection({ config }: { config: ReglamentoConfig }) {
  const reglas = (config.reglas ?? []).map((r) => (typeof r === 'string' ? r.trim() : '')).filter(Boolean)
  if (reglas.length === 0) return null

  const eyebrow = config.eyebrow?.trim() || 'REGLAMENTO'
  const titulo = config.titulo?.trim() || 'REGLAS DE CAMPO'
  const piePagina = config.pie_pagina?.trim() || 'SPEAR Airsoft Productions · Biohazard 2: Día Cero'

  return (
    <section id="reglamento" data-section="reglamento" className="relative w-full overflow-hidden bg-[#EFE9D9] py-16 text-[#1a1a1a] md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.65\' numOctaves=\'3\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 md:mb-10">
          <p className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}>
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl leading-none sm:text-4xl md:text-6xl" style={BH2_HEADER_STYLE}>
            {titulo}
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -18 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 150, damping: 14, delay: 0.3 }}
            className="absolute -top-4 right-2 z-20 md:-top-6 md:right-6"
          >
            <div className="border-[3px] border-[#CC4B37] bg-[#FAF5E8]/95 px-3 py-1 md:px-4" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, letterSpacing: '0.18em' }}>
              <p className="text-[0.65rem] text-[#CC4B37] md:text-sm">CONFIDENCIAL</p>
            </div>
          </motion.div>

          <div className="relative bg-[#FAF5E8] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
            <div aria-hidden className="pointer-events-none absolute bottom-0 left-[58px] top-0 w-[2px] bg-[#CC4B37] md:left-[72px]" />
            <div className="relative flex items-start justify-end border-b border-[#D4C9A8]/50 px-6 py-4 pl-[80px] md:px-10 md:pl-[100px]">
              <p className="text-right text-[9px] uppercase tracking-[0.15em] text-[#8b7e57] md:text-[10px]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                DOC. BH2-02
                <br />
                CLASIF. CONFIDENCIAL
                <br />
                ED. 2026
              </p>
            </div>
            <div className="relative px-6 py-8 pl-[80px] md:px-10 md:py-10 md:pl-[100px]">
              {reglas.map((regla, i) => (
                <ReglaRow key={`${i}-${regla.slice(0, 24)}`} numero={String(i + 1).padStart(2, '0')} texto={regla} />
              ))}
            </div>
            <div className="relative border-t border-[#D4C9A8]/50 px-6 py-3 pl-[80px] md:px-10 md:pl-[100px]">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#8b7e57] md:text-[10px]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                {piePagina} · pág 01 / 01
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ReglaRow({ numero, texto }: { numero: string; texto: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [typed, setTyped] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setStarted(true)
      },
      { threshold: 0.35 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = window.setInterval(() => {
      i += 1
      setTyped(texto.slice(0, i))
      if (i >= texto.length) window.clearInterval(interval)
    }, 18)
    return () => window.clearInterval(interval)
  }, [started, texto])

  return (
    <div ref={ref} className="relative flex min-h-[40px] items-baseline gap-3 py-0.5 md:gap-4">
      <span className="shrink-0 text-base leading-[40px] text-[#CC4B37] md:text-lg" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700 }}>
        {numero}
      </span>
      <span className="shrink-0 select-none leading-[40px] text-[#D4C9A8]" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        ····
      </span>
      <p className="min-w-0 flex-1 text-sm leading-[40px] text-[#1a1a1a] md:text-base" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        {typed}
        {started && typed.length < texto.length ? (
          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#CC4B37] align-middle" />
        ) : null}
      </p>
    </div>
  )
}
