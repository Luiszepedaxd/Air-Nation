'use client'

import { motion } from 'framer-motion'
import type { ProductorConfig } from '../lib/types'
import { BH2_HEADER_STYLE } from '../lib/theme'
import { propsEnlace } from '../lib/enlaces'

const REDES: { key: keyof Pick<ProductorConfig, 'instagram' | 'facebook' | 'whatsapp' | 'sitio'>; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'sitio', label: 'Sitio' },
]

export function ProductorSection({ config }: { config: ProductorConfig }) {
  const nombre = config.nombre?.trim() || ''
  if (!nombre) return null

  const eyebrow = config.eyebrow?.trim() || 'PRODUCE'
  const titulo = config.titulo?.trim() || ''
  const logo = config.logo_url?.trim() || ''
  const descripcion = config.descripcion?.trim() || ''
  const links = REDES.map((r) => ({ ...r, url: (config[r.key] || '').trim() })).filter((r) =>
    /^https?:\/\//i.test(r.url)
  )

  return (
    <section
      id="productor"
      data-section="productor"
      className="w-full overflow-hidden bg-[#F5F3EF] py-16 text-[#111111] md:py-24"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-[0.65rem] tracking-[0.4em] text-[#CC4B37]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}>
            {eyebrow}
          </p>
          {titulo ? (
            <h2 className="mt-3 text-3xl leading-none md:text-5xl" style={BH2_HEADER_STYLE}>
              {titulo}
            </h2>
          ) : null}
        </motion.div>

        <div className="mt-8 flex flex-col items-start gap-6 md:flex-row md:items-center">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="max-h-24 w-auto max-w-[200px] object-contain" />
          ) : null}
          <div className="min-w-0">
            <h3 className="text-2xl md:text-3xl" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, textTransform: 'uppercase' }}>
              {nombre}
            </h3>
            {descripcion ? (
              <p className="mt-3 text-sm leading-relaxed text-[#444] md:text-base" style={{ fontFamily: 'Lato, sans-serif' }}>
                {descripcion}
              </p>
            ) : null}
          </div>
        </div>

        {links.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {links.map((l) => (
              <a
                key={l.key}
                href={l.url}
                {...propsEnlace(l.url)}
                className="border border-[#111111] px-4 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
              >
                {l.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
