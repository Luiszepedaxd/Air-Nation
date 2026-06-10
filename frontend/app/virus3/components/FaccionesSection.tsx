'use client'

import { motion } from 'framer-motion'
import type { FaccionesConfig, FaccionV3 } from '../lib/types'

export function FaccionesSection({ config }: { config: FaccionesConfig }) {
  const facciones = (config.facciones ?? []).filter((f) => f?.nombre?.trim())
  const eyebrow = config.eyebrow?.trim() || 'ELIGE TU BANDO'
  const titulo = config.titulo?.trim() || 'FACCIÓNES'

  return (
    <section
      id="facciones"
      data-section="facciones"
      className="relative w-full bg-[#0a0a0a] py-16 text-white md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center md:mb-14"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          <h2
            className="mt-3 text-3xl leading-none sm:text-4xl md:text-5xl lg:text-6xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            {titulo}
          </h2>
        </motion.div>

        {facciones.length === 0 ? (
          <p
            className="text-center text-sm text-white/50"
            style={{ fontFamily: 'Lato, sans-serif' }}
          >
            Facciones próximamente
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {facciones.map((f, i) => (
              <FaccionCard key={`${f.nombre}-${i}`} faccion={f} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FaccionCard({ faccion, index }: { faccion: FaccionV3; index: number }) {
  const agotada = Boolean(faccion.agotada)
  const whatsapp = faccion.contacto_whatsapp?.trim()

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]"
      style={{ borderRadius: 2 }}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        {faccion.imagen_url?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faccion.imagen_url}
            alt={faccion.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-white/30">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        {agotada ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span
              className="bg-[#CC4B37] px-6 py-2 text-sm tracking-[0.3em] text-white md:text-base"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
            >
              SOLD OUT
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 p-5 md:p-6">
        <h3
          className="text-xl tracking-wide md:text-2xl"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          {faccion.nombre}
        </h3>

        {faccion.descripcion?.trim() ? (
          <p
            className="text-sm leading-relaxed text-white/70 md:text-base"
            style={{ fontFamily: 'Lato, sans-serif' }}
          >
            {faccion.descripcion}
          </p>
        ) : null}

        {faccion.loadout?.trim() ? (
          <div>
            <p
              className="mb-1 text-[0.6rem] tracking-[0.2em] text-[#CC4B37] md:text-[0.65rem]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              LOADOUT REQUERIDO
            </p>
            <p
              className="text-sm text-white/80"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              {faccion.loadout}
            </p>
          </div>
        ) : null}

        {whatsapp && !agotada ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center bg-[#25D366] px-5 py-3 text-[0.65rem] uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
          >
            WhatsApp{faccion.contacto_nombre?.trim() ? ` — ${faccion.contacto_nombre}` : ''}
          </a>
        ) : whatsapp && agotada ? (
          <span
            className="mt-2 inline-flex cursor-not-allowed items-center justify-center bg-[#555555] px-5 py-3 text-[0.65rem] uppercase tracking-[0.15em] text-white/60"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
          >
            Agotada
          </span>
        ) : null}
      </div>
    </motion.article>
  )
}
