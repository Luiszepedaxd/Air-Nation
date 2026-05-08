'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { ManualConfig } from '../lib/types'

export function ManualSection({ config }: { config: ManualConfig }) {
  const reglas = config.reglas ?? []

  return (
    <section
      data-section="manual"
      className="relative w-full overflow-hidden bg-[#F5F3EF] py-20 text-[#1a1a1a] md:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.7\' numOctaves=\'3\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
        whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 150, damping: 14, delay: 0.5 }}
        className="absolute right-4 top-8 z-10 md:right-12 md:top-16"
      >
        <div
          className="border-4 border-[#CC4B37] px-3 py-1.5 md:px-5 md:py-2"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '0.15em',
          }}
        >
          <p className="text-[0.7rem] text-[#CC4B37] md:text-base">CONFIDENCIAL</p>
        </div>
      </motion.div>

      <div className="relative mx-auto max-w-4xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12 md:mb-16"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {config.eyebrow}
          </p>
          <h2
            className="mt-4 text-4xl leading-none md:text-6xl lg:text-7xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {config.titulo}
          </h2>
        </motion.div>

        {reglas.length === 0 ? (
          <p
            className="text-sm uppercase tracking-[0.2em] text-[#666] md:text-base"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
          >
            Reglas pendientes de publicar
          </p>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {reglas.map((regla, i) => (
              <ReglaRow
                key={`${i}-${regla.slice(0, 24)}`}
                numero={String(i + 1).padStart(2, '0')}
                texto={regla}
              />
            ))}
          </div>
        )}
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
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true)
          }
        })
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    if (!texto.length) {
      setTyped('')
      return
    }
    let i = 0
    const interval = window.setInterval(() => {
      i += 1
      setTyped(texto.slice(0, i))
      if (i >= texto.length) window.clearInterval(interval)
    }, 18)
    return () => window.clearInterval(interval)
  }, [started, texto])

  const typing = started && typed.length < texto.length

  return (
    <div
      ref={ref}
      className="flex items-baseline gap-2 border-b border-dashed border-[#1a1a1a]/15 pb-3 md:gap-3 md:pb-4"
    >
      <span
        className="shrink-0 text-base text-[#CC4B37] md:text-xl"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontWeight: 700,
        }}
      >
        {numero}
      </span>
      <span
        className="mb-[0.35em] min-h-[1px] min-w-[0.75rem] flex-1 border-b border-dotted border-[#1a1a1a]/35"
        aria-hidden
      />
      <p
        className="min-w-0 flex-[1.15] text-sm leading-snug text-[#1a1a1a] md:text-base"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
      >
        {typed}
        {typing ? (
          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#CC4B37] align-middle" />
        ) : null}
      </p>
    </div>
  )
}
