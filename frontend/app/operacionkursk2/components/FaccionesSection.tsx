'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FaccionesConfig, FaccionData } from '../lib/types'

type Side = 'rusa' | 'ucraniana' | null

const EMPTY_FACTION: FaccionData = {
  nombre: '',
  imagen_url: '',
  descripcion: '',
  uniformes: [],
  contacto_nombre: '',
  contacto_whatsapp: '',
}

export function FaccionesSection({ config }: { config: FaccionesConfig }) {
  const [active, setActive] = useState<Side>(null)

  const rusa = config.rusa ?? EMPTY_FACTION
  const ucraniana = config.ucraniana ?? EMPTY_FACTION

  const rusaWidth = active === 'rusa' ? '65%' : active === 'ucraniana' ? '35%' : '50%'
  const ucraWidth = active === 'ucraniana' ? '65%' : active === 'rusa' ? '35%' : '50%'

  return (
    <section
      id="facciones"
      data-section="facciones"
      className="relative w-full overflow-hidden bg-black text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8 md:py-24">
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
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-4 text-4xl leading-none md:text-7xl lg:text-8xl"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          {config.titulo}
        </motion.h2>
      </div>

      <div className="relative hidden h-[80vh] w-full md:block">
        <FactionPanel
          side="rusa"
          data={rusa}
          width={rusaWidth}
          isActive={active === 'rusa'}
          isInactive={active === 'ucraniana'}
          onEnter={() => setActive('rusa')}
          onLeave={() => setActive(null)}
          align="left"
        />
        <FactionPanel
          side="ucraniana"
          data={ucraniana}
          width={ucraWidth}
          isActive={active === 'ucraniana'}
          isInactive={active === 'rusa'}
          onEnter={() => setActive('ucraniana')}
          onLeave={() => setActive(null)}
          align="right"
        />
      </div>

      <div className="flex flex-col md:hidden">
        <FactionMobileCard data={rusa} side="rusa" />
        <FactionMobileCard data={ucraniana} side="ucraniana" />
      </div>

      {config.nota ? (
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 text-center md:px-8 md:pb-24">
          <p
            className="text-[0.7rem] italic text-white/50 md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 400 }}
          >
            {config.nota}
          </p>
        </div>
      ) : null}
    </section>
  )
}

function FactionPanel({
  side,
  data,
  width,
  isActive,
  isInactive,
  onEnter,
  onLeave,
  align,
}: {
  side: 'rusa' | 'ucraniana'
  data: FaccionData
  width: string
  isActive: boolean
  isInactive: boolean
  onEnter: () => void
  onLeave: () => void
  align: 'left' | 'right'
}) {
  const clipPath =
    align === 'left'
      ? 'polygon(0 0, 100% 0, calc(100% - 80px) 100%, 0 100%)'
      : 'polygon(80px 0, 100% 0, 100% 100%, 0 100%)'

  const filterStyle = isInactive
    ? 'grayscale(0.85) brightness(0.4)'
    : isActive
      ? 'grayscale(0) brightness(0.9) saturate(1.2)'
      : 'grayscale(0.5) brightness(0.6)'

  const nombre = (data.nombre || 'FACCIÓN').replace(/^FACCIÓN\s+/i, '')

  return (
    <motion.div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      animate={{ width }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className={`absolute top-0 h-full cursor-pointer ${
        align === 'left' ? 'left-0' : 'right-0'
      }`}
      style={{ clipPath }}
    >
      <div className="absolute inset-0">
        {data.imagen_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={data.imagen_url}
            alt={data.nombre || nombre}
            className="h-full w-full object-cover transition-all duration-700"
            style={{ filter: filterStyle }}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                side === 'rusa'
                  ? 'linear-gradient(135deg, #1a2a1a 0%, #0a1a0a 100%)'
                  : 'linear-gradient(135deg, #2a2415 0%, #1a1408 100%)',
              filter: filterStyle,
            }}
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />

      <div
        className={`relative z-10 flex h-full flex-col justify-end p-8 lg:p-12 ${
          align === 'left' ? 'items-start text-left' : 'items-end text-right'
        }`}
      >
        <p
          className="text-[0.6rem] tracking-[0.4em] text-white/60"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          FACCIÓN
        </p>
        <h3
          className="mt-2 text-3xl leading-none lg:text-5xl xl:text-6xl"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          {nombre}
        </h3>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className={`mt-6 flex flex-col gap-3 ${
                align === 'right' ? 'items-end' : 'items-start'
              }`}
            >
              <p
                className="text-[0.55rem] tracking-[0.3em] text-white/60"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
              >
                UNIFORMES VÁLIDOS
              </p>
              <div
                className={`flex flex-col gap-2 ${align === 'right' ? 'items-end' : 'items-start'}`}
              >
                {(data.uniformes ?? []).map((u, i) => (
                  <motion.div
                    key={`${u.nombre}-${i}`}
                    initial={{ opacity: 0, x: align === 'left' ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse' : ''}`}
                  >
                    <span
                      className="block h-4 w-12 border border-white/20"
                      style={{ backgroundColor: u.hex }}
                    />
                    <span
                      className="text-[0.7rem] tracking-[0.15em] text-white"
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
                    >
                      {u.nombre}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isActive && data.contacto_whatsapp ? (
            <motion.a
              href={data.contacto_whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-8 inline-block bg-[#CC4B37] px-6 py-3 text-[0.7rem] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#a83b2c]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
              onClick={(e) => e.stopPropagation()}
            >
              Inscribirme — {data.contacto_nombre || 'Contacto'}
            </motion.a>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function FactionMobileCard({
  data,
  side,
}: {
  data: FaccionData
  side: 'rusa' | 'ucraniana'
}) {
  const nombre = (data.nombre || 'FACCIÓN').replace(/^FACCIÓN\s+/i, '')

  return (
    <div className="relative min-h-[80vh] w-full overflow-hidden">
      {data.imagen_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={data.imagen_url}
          alt={data.nombre || nombre}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'grayscale(0.3) brightness(0.7)' }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              side === 'rusa'
                ? 'linear-gradient(135deg, #1a2a1a 0%, #0a1a0a 100%)'
                : 'linear-gradient(135deg, #2a2415 0%, #1a1408 100%)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
      <div className="relative z-10 flex min-h-[80vh] flex-col justify-end p-6">
        <p
          className="text-[0.6rem] tracking-[0.4em] text-white/60"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          FACCIÓN
        </p>
        <h3
          className="mt-2 text-4xl leading-none"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          {nombre}
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {(data.uniformes ?? []).map((u) => (
            <div
              key={u.nombre}
              className="flex items-center gap-2 border border-white/15 bg-black/40 px-2 py-1"
            >
              <span className="block h-3 w-6" style={{ backgroundColor: u.hex }} />
              <span
                className="text-[0.6rem] tracking-[0.1em] text-white"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 500 }}
              >
                {u.nombre}
              </span>
            </div>
          ))}
        </div>
        {data.contacto_whatsapp ? (
          <a
            href={data.contacto_whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block self-start bg-[#CC4B37] px-5 py-3 text-[0.65rem] uppercase tracking-[0.2em] text-white"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
          >
            Inscribirme — {data.contacto_nombre || 'Contacto'}
          </a>
        ) : null}
      </div>
    </div>
  )
}
