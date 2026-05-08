'use client'

import { motion } from 'framer-motion'
import type { CtaFinalConfig } from '../lib/types'

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('//')
}

export function CtaFinalSection({ config }: { config: CtaFinalConfig }) {
  const lineas = [config.linea1, config.linea2, config.linea3].filter(Boolean)

  return (
    <section
      data-section="cta_final"
      className="relative w-full overflow-hidden bg-[#F5F3EF] py-24 text-[#111111] md:py-40"
    >
      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
        {/* Desktop: texto RU · UA */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-10 hidden text-center md:mb-14 md:block"
        >
          <p
            className="text-3xl tracking-[0.3em] text-[#CC4B37] md:text-4xl"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
          >
            RU · UA
          </p>
        </motion.div>

        {/* Mobile: emojis */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-10 flex justify-center gap-3 text-5xl md:hidden"
        >
          <span>🇷🇺</span>
          <span>🇺🇦</span>
        </motion.div>

        <div className="space-y-3 md:space-y-5">
          {lineas.map((linea, i) => (
            <motion.p
              key={`${i}-${linea.slice(0, 32)}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.4, ease: 'easeOut' }}
              className={`text-2xl leading-tight md:text-4xl lg:text-5xl ${
                i === lineas.length - 1 ? 'text-[#111111]' : 'text-[#666666]'
              }`}
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              {linea}
            </motion.p>
          ))}
        </div>

        {config.cta_titulo ? (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 1.6 }}
            className="mt-16 text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:mt-24 md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {config.cta_titulo}
          </motion.p>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 1.8 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4"
        >
          {config.cta1_link ? (
            <a
              href={config.cta1_link}
              {...(isExternalHref(config.cta1_link)
                ? { target: '_blank' as const, rel: 'noopener noreferrer' }
                : {})}
              className="inline-flex w-full max-w-xs items-center justify-center bg-[#CC4B37] px-6 py-3.5 text-[0.7rem] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 md:w-auto md:min-w-[260px]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              {config.cta1_texto}
            </a>
          ) : null}
          {config.cta2_link ? (
            <a
              href={config.cta2_link}
              {...(isExternalHref(config.cta2_link)
                ? { target: '_blank' as const, rel: 'noopener noreferrer' }
                : {})}
              className="inline-flex w-full max-w-xs items-center justify-center border border-[#111] bg-transparent px-6 py-3.5 text-[0.7rem] uppercase tracking-[0.18em] text-[#111] transition-colors hover:bg-[#111] hover:text-white md:w-auto md:min-w-[260px]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              {config.cta2_texto}
            </a>
          ) : null}
        </motion.div>
      </div>

      <div className="mt-20 border-t border-[#E5E0DA] md:mt-32">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center md:px-8 md:py-8">
          <p
            className="text-[0.55rem] tracking-[0.4em] text-[#999999]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            OPERACIÓN KURSK II · TOLOKS CLUB AIRSOFT · 2026
          </p>
        </div>
      </div>
    </section>
  )
}
