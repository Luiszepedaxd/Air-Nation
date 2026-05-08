'use client'

import { motion } from 'framer-motion'
import type { AirnationConfig } from '../lib/types'

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('//')
}

export function AirnationSection({ config }: { config: AirnationConfig }) {
  const ctaHref = config.cta_link?.trim()
  const ctaExternal = ctaHref ? isExternalHref(ctaHref) : false

  return (
    <section
      data-section="airnation"
      className="relative w-full overflow-hidden bg-[#0A0A0A] py-24 text-white md:py-40"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ backgroundColor: '#CC4B37' }}
      />

      <div className="relative z-[1] mx-auto max-w-4xl px-4 text-center md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {config.eyebrow}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="my-10 md:my-14"
        >
          <p
            className="text-5xl leading-none md:text-7xl lg:text-8xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            <span className="text-white">AIR</span>
            <span className="text-[#CC4B37]">NATION</span>
          </p>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-2xl leading-tight text-white md:text-4xl lg:text-5xl"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
        >
          {config.titulo}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg"
          style={{ fontFamily: 'Lato, sans-serif', fontWeight: 400 }}
        >
          {config.descripcion}
        </motion.p>

        {ctaHref ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-10 md:mt-14"
          >
            <a
              href={ctaHref}
              {...(ctaExternal
                ? { target: '_blank' as const, rel: 'noopener noreferrer' }
                : {})}
              className="inline-flex items-center justify-center bg-[#CC4B37] px-7 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              {config.cta_texto}
            </a>
          </motion.div>
        ) : null}
      </div>
    </section>
  )
}
