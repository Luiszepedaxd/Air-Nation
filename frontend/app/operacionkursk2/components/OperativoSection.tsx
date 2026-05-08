'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { OperativoConfig, OperativoHito } from '../lib/types'

export function OperativoSection({ config }: { config: OperativoConfig }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const pathLength = useTransform(scrollYProgress, [0.1, 0.9], [0, 1])

  return (
    <section
      id="operativo"
      data-section="operativo"
      className="relative w-full bg-[#FFFFFF] py-20 text-[#111111] md:py-32"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-24"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {config.eyebrow}
          </p>
          <h2
            className="mt-4 text-4xl leading-none md:text-7xl lg:text-8xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {config.titulo}
          </h2>
        </motion.div>

        <div ref={ref} className="relative">
          <svg
            className="absolute left-[20px] top-0 hidden h-full w-3 md:block md:left-[80px]"
            viewBox="0 0 4 1000"
            preserveAspectRatio="none"
            style={{ height: '100%' }}
            aria-hidden
          >
            <motion.path
              d="M 2 0 L 2 1000"
              stroke="#CC4B37"
              strokeWidth="2"
              fill="none"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength }}
            />
          </svg>

          <motion.div
            className="absolute left-[10px] top-0 h-full w-px origin-top bg-[#CC4B37] md:hidden"
            style={{ scaleY: pathLength }}
          />

          <div className="space-y-12 md:space-y-20">
            {(config.hitos ?? []).map((hito, i) => (
              <HitoRow key={`${hito.hora}-${hito.titulo}-${i}`} hito={hito} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HitoRow({ hito, index }: { hito: OperativoHito; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: 'easeOut' }}
      className="relative grid grid-cols-[40px_1fr] items-start gap-4 md:grid-cols-[100px_1fr] md:gap-12"
    >
      <div className="relative flex items-start justify-end pr-2 md:pr-4">
        <div className="absolute left-[1px] top-1.5 h-3 w-3 rounded-full bg-[#CC4B37] ring-4 ring-[#FFFFFF] md:left-[71px]" />
        <div className="text-right">
          <p
            className="text-base text-[#111111] md:text-2xl"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontWeight: 700,
            }}
          >
            {hito.hora}
          </p>
        </div>
      </div>

      <div className="pl-4 md:pl-8">
        <div className="flex items-center gap-3">
          {hito.nocturno ? <MoonIcon /> : <SunIcon />}
          <h3
            className="text-lg uppercase text-[#111111] md:text-2xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            {hito.titulo}
          </h3>
        </div>
        {hito.descripcion ? (
          <p
            className="mt-2 text-sm text-[#666666] md:text-base"
            style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400 }}
          >
            {hito.descripcion}
          </p>
        ) : null}
      </div>
    </motion.div>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="#CC4B37" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="#CC4B37"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="#CC4B37"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(204,75,55,0.1)"
      />
    </svg>
  )
}
