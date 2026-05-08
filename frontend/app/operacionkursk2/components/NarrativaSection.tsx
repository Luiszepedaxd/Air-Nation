'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { NarrativaConfig } from '../lib/types'

export function NarrativaSection({ config }: { config: NarrativaConfig }) {
  const bloques = config.bloques ?? []
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || bloques.length === 0) return
    const onScroll = () => {
      const first = el.children[0] as HTMLElement | undefined
      const cardW = first?.offsetWidth ?? el.clientWidth
      const gap = 16
      const idx = Math.round(el.scrollLeft / Math.max(cardW + gap, 1))
      setActiveIndex(Math.min(Math.max(0, idx), bloques.length - 1))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [bloques.length])

  return (
    <section
      data-section="narrativa"
      className="relative w-full bg-[#F5F3EF] py-16 text-[#111111] md:py-28"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-[0.65rem] tracking-[0.4em] text-[#CC4B37] md:mb-20 md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          UN CONFLICTO. TRES TIEMPOS.
        </motion.p>
      </div>

      <div className="md:hidden">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {bloques.map((bloque, i) => (
            <div
              key={`${bloque.anio}-${i}`}
              data-narrativa-slide
              className="w-[85vw] shrink-0 snap-center border border-[#E5E0DA] bg-white p-6"
            >
              <p
                className="text-5xl leading-none text-[#111111]"
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                {bloque.anio}
              </p>
              <p
                className="mt-6 text-base leading-snug text-[#666666]"
                style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400 }}
              >
                {bloque.texto}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {bloques.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex ? 'w-6 bg-[#CC4B37]' : 'w-1.5 bg-[#E5E0DA]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto hidden max-w-5xl px-4 md:block md:px-8">
        <div className="space-y-16 md:space-y-24">
          {bloques.map((bloque, i) => (
            <motion.div
              key={`${bloque.anio}-d-${i}`}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-150px' }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="grid grid-cols-12 items-baseline gap-8"
            >
              <div className="col-span-4">
                <p
                  className="text-7xl leading-none text-[#111111] lg:text-9xl"
                  style={{
                    fontFamily: 'Jost, sans-serif',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {bloque.anio}
                </p>
              </div>
              <div className="col-span-8">
                <p
                  className={`text-2xl leading-snug lg:text-3xl ${
                    i === bloques.length - 1 ? 'text-[#111111]' : 'text-[#666666]'
                  }`}
                  style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400 }}
                >
                  {bloque.texto}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
