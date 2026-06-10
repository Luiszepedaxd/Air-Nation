'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FaccionesConfig, FaccionV3 } from '../lib/types'

export function FaccionesSection({ config }: { config: FaccionesConfig }) {
  const facciones = (config.facciones ?? []).filter((f) => f?.nombre?.trim())
  const eyebrow = config.eyebrow?.trim() || 'ELIGE TU BANDO'
  const titulo = config.titulo?.trim() || 'FACCIONES'
  const [active, setActive] = useState(0)

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
          <p className="text-center text-sm text-white/50" style={{ fontFamily: 'Lato, sans-serif' }}>
            Facciones próximamente
          </p>
        ) : (
          <>
            {/* Desktop: 4 cards visibles */}
            <div className="hidden gap-6 md:grid md:grid-cols-4">
              {facciones.map((f, i) => (
                <FaccionCard key={`${f.nombre}-${i}`} faccion={f} index={i} />
              ))}
            </div>

            {/* Mobile: una card a la vez */}
            <div className="md:hidden">
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.28 }}
                  >
                    <FaccionCard faccion={facciones[active]} index={active} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dots */}
              <div className="mt-6 flex items-center justify-center gap-2">
                {facciones.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Facción ${i + 1}`}
                    className="transition-all duration-200"
                    style={{
                      width: i === active ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === active ? '#CC4B37' : 'rgba(255,255,255,0.35)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </>
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
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="flex flex-col overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]"
      style={{ borderRadius: 3 }}
    >
      {/* Imagen vertical tipo carta */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
        {faccion.imagen_url?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faccion.imagen_url}
            alt={faccion.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-white/20">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Nombre sobre la imagen en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3
            className="text-xl leading-tight"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, textTransform: 'uppercase' }}
          >
            {faccion.nombre}
          </h3>
        </div>

        {agotada && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span
              className="bg-[#CC4B37] px-6 py-2 text-sm tracking-[0.3em] text-white"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
            >
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Info debajo */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {faccion.descripcion?.trim() && (
          <p className="text-xs leading-relaxed text-white/65" style={{ fontFamily: 'Lato, sans-serif' }}>
            {faccion.descripcion}
          </p>
        )}

        {faccion.loadout?.trim() && (
          <div>
            <p
              className="mb-1 text-[0.55rem] tracking-[0.2em] text-[#CC4B37]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              LOADOUT REQUERIDO
            </p>
            <p className="text-xs text-white/70" style={{ fontFamily: 'Lato, sans-serif' }}>
              {faccion.loadout}
            </p>
          </div>
        )}

        {whatsapp && !agotada && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center bg-[#25D366] px-4 py-2.5 text-[0.6rem] uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
          >
            WhatsApp{faccion.contacto_nombre?.trim() ? ` — ${faccion.contacto_nombre}` : ''}
          </a>
        )}

        {whatsapp && agotada && (
          <span
            className="mt-auto inline-flex cursor-not-allowed items-center justify-center bg-[#333] px-4 py-2.5 text-[0.6rem] uppercase tracking-[0.15em] text-white/40"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
          >
            Agotada
          </span>
        )}
      </div>
    </motion.article>
  )
}
