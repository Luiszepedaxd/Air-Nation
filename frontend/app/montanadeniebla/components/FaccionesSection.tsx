'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FaccionesConfig, FaccionMdN, CodigoUniforme } from '../lib/types'

type Side = 'red_sun' | 'lux_et_umbra' | null

const EMPTY_CODIGO: CodigoUniforme = {
  titulo: '',
  permitidos: [],
  prohibidos: [],
}

const EMPTY_FACTION: FaccionMdN = {
  nombre: '',
  imagen_url: '',
  logo_url: '',
  descripcion: '',
  codigo_uniforme: EMPTY_CODIGO,
  contacto_nombre: '',
  contacto_whatsapp: '',
}

function normalizeFaction(raw: unknown, fallbackNombre: string): FaccionMdN {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_FACTION, nombre: fallbackNombre }
  }
  const o = raw as Record<string, unknown>
  const cu = o.codigo_uniforme
  let codigo: CodigoUniforme = { ...EMPTY_CODIGO }
  if (cu && typeof cu === 'object' && !Array.isArray(cu)) {
    const c = cu as Record<string, unknown>
    codigo = {
      titulo: typeof c.titulo === 'string' ? c.titulo : '',
      permitidos: Array.isArray(c.permitidos)
        ? c.permitidos.filter((x): x is string => typeof x === 'string')
        : [],
      prohibidos: Array.isArray(c.prohibidos)
        ? c.prohibidos.filter((x): x is string => typeof x === 'string')
        : [],
    }
  }
  return {
    nombre: typeof o.nombre === 'string' && o.nombre.trim() ? o.nombre : fallbackNombre,
    imagen_url: typeof o.imagen_url === 'string' ? o.imagen_url : '',
    logo_url: typeof o.logo_url === 'string' ? o.logo_url : '',
    descripcion: typeof o.descripcion === 'string' ? o.descripcion : '',
    codigo_uniforme: codigo,
    contacto_nombre: typeof o.contacto_nombre === 'string' ? o.contacto_nombre : '',
    contacto_whatsapp: typeof o.contacto_whatsapp === 'string' ? o.contacto_whatsapp : '',
  }
}

export function FaccionesSection({ config }: { config: FaccionesConfig }) {
  const [active, setActive] = useState<Side>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const [mobileActive, setMobileActive] = useState(0)

  const redSun = normalizeFaction(config.red_sun, 'RED SUN')
  const luxEtUmbra = normalizeFaction(config.lux_et_umbra, 'LUX ET UMBRA')

  const redWidth = active === 'red_sun' ? '65%' : active === 'lux_et_umbra' ? '35%' : '50%'
  const luxWidth = active === 'lux_et_umbra' ? '65%' : active === 'red_sun' ? '35%' : '50%'

  useEffect(() => {
    const el = mobileScrollRef.current
    if (!el) return
    const gapPx = 16
    const onScroll = () => {
      const first = el.children[0] as HTMLElement | undefined
      const slideW = first?.offsetWidth ?? el.clientWidth
      const idx = Math.round(el.scrollLeft / Math.max(slideW + gapPx, 1))
      setMobileActive(Math.min(1, Math.max(0, idx)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const eyebrow = config.eyebrow?.trim() || 'ELIGE TU BANDO'
  const titulo = config.titulo?.trim() || 'FACCIONES'

  return (
    <section
      id="facciones"
      data-section="facciones"
      className="relative w-full overflow-hidden bg-[#F5F3EF] text-[#111111]"
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
          {eyebrow}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-4 text-4xl leading-none text-[#111111] md:text-7xl lg:text-8xl"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          {titulo}
        </motion.h2>
      </div>

      <div className="hidden w-full pt-4 md:block md:pt-6">
        <div className="relative h-[80vh] w-full">
          <FactionPanel
            side="red_sun"
            data={redSun}
            width={redWidth}
            isActive={active === 'red_sun'}
            isInactive={active === 'lux_et_umbra'}
            onEnter={() => setActive('red_sun')}
            onLeave={() => setActive(null)}
            align="left"
            accent="#CC4B37"
          />
          <FactionPanel
            side="lux_et_umbra"
            data={luxEtUmbra}
            width={luxWidth}
            isActive={active === 'lux_et_umbra'}
            isInactive={active === 'red_sun'}
            onEnter={() => setActive('lux_et_umbra')}
            onLeave={() => setActive(null)}
            align="right"
            accent="#D4A017"
          />
        </div>
      </div>

      <div className="md:hidden">
        <div
          ref={mobileScrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto bg-transparent px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-[calc(100vw-2rem)] shrink-0 snap-center">
            <FactionMobileCard data={redSun} accent="#CC4B37" />
          </div>
          <div className="w-[calc(100vw-2rem)] shrink-0 snap-center">
            <FactionMobileCard data={luxEtUmbra} accent="#D4A017" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 bg-transparent py-4">
          <span
            className={`h-1 rounded-full transition-all ${
              mobileActive === 0 ? 'w-8 bg-[#CC4B37]' : 'w-4 bg-[#E5E0DA]'
            }`}
          />
          <span
            className={`h-1 rounded-full transition-all ${
              mobileActive === 1 ? 'w-8 bg-[#CC4B37]' : 'w-4 bg-[#E5E0DA]'
            }`}
          />
        </div>
      </div>

      {config.nota?.trim() ? (
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 text-center md:px-8 md:pb-24">
          <p
            className="text-[0.7rem] italic text-[#666] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 400 }}
          >
            {config.nota}
          </p>
        </div>
      ) : null}
    </section>
  )
}

function CodigoUniformeBlock({
  codigo,
  accent,
  align,
  expanded,
}: {
  codigo: CodigoUniforme
  accent: string
  align: 'left' | 'right'
  expanded: boolean
}) {
  const titulo = codigo.titulo?.trim() || 'Código de uniforme'
  const permitidos = (codigo.permitidos ?? []).filter((p) => p.trim())
  const prohibidos = (codigo.prohibidos ?? []).filter((p) => p.trim())

  if (!expanded && !titulo && permitidos.length === 0 && prohibidos.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {expanded ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className={`mt-6 w-full max-w-md border border-white/15 bg-black/50 p-4 backdrop-blur-sm ${
            align === 'right' ? 'ml-auto' : 'mr-auto'
          }`}
          style={{ borderRadius: 2 }}
        >
          <p
            className="text-[0.55rem] tracking-[0.35em] text-white/70"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            CÓDIGO DE UNIFORME
          </p>
          <p
            className="mt-2 inline-block px-2 py-1 text-[0.65rem] tracking-[0.2em] text-white"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 800,
              backgroundColor: accent,
              borderRadius: 2,
            }}
          >
            {titulo}
          </p>
          {permitidos.length > 0 ? (
            <ul className={`mt-4 space-y-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>
              {permitidos.map((item, i) => (
                <motion.li
                  key={`p-${i}-${item}`}
                  initial={{ opacity: 0, x: align === 'left' ? -8 : 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className={`flex items-center gap-2 text-[0.75rem] text-white/90 ${
                    align === 'right' ? 'flex-row-reverse' : ''
                  }`}
                  style={{ fontFamily: 'Lato, sans-serif' }}
                >
                  <span className="text-[#3AA76D]" aria-hidden>
                    ✓
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
          ) : null}
          {prohibidos.length > 0 ? (
            <ul className={`mt-3 space-y-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>
              {prohibidos.map((item, i) => (
                <motion.li
                  key={`x-${i}-${item}`}
                  initial={{ opacity: 0, x: align === 'left' ? -8 : 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className={`flex items-center gap-2 text-[0.75rem] text-white/90 ${
                    align === 'right' ? 'flex-row-reverse' : ''
                  }`}
                  style={{ fontFamily: 'Lato, sans-serif' }}
                >
                  <span className="text-[#CC4B37]" aria-hidden>
                    ✕
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
          ) : null}
          {permitidos.length === 0 && prohibidos.length === 0 ? (
            <p className="mt-3 text-[0.7rem] text-white/60" style={{ fontFamily: 'Lato, sans-serif' }}>
              Detalle de uniforme próximamente
            </p>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
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
  accent,
}: {
  side: Side
  data: FaccionMdN
  width: string
  isActive: boolean
  isInactive: boolean
  onEnter: () => void
  onLeave: () => void
  align: 'left' | 'right'
  accent: string
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

  const nombre = data.nombre.trim() || (side === 'red_sun' ? 'RED SUN' : 'LUX ET UMBRA')
  const descripcion =
    data.descripcion?.trim() ||
    'Información de la facción disponible próximamente.'

  return (
    <motion.div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      animate={{ width }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className={`absolute top-0 h-full cursor-pointer text-white ${
        align === 'left' ? 'left-0' : 'right-0'
      }`}
      style={{ clipPath }}
    >
      <div className="absolute inset-0">
        {data.imagen_url?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imagen_url}
            alt={nombre}
            className="h-full w-full object-cover transition-all duration-700"
            style={{ filter: filterStyle }}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                side === 'red_sun'
                  ? 'linear-gradient(135deg, #3a1510 0%, #0a0a0a 100%)'
                  : 'linear-gradient(135deg, #2a2415 0%, #0a0a0a 100%)',
              filter: filterStyle,
            }}
          />
        )}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            side === 'red_sun'
              ? 'linear-gradient(to bottom, rgba(204,75,55,0.15), rgba(0,0,0,0.85))'
              : 'linear-gradient(to bottom, rgba(212,160,23,0.12), rgba(0,0,0,0.85))',
        }}
      />

      {data.logo_url?.trim() ? (
        <div
          className={`absolute top-6 z-20 overflow-hidden border-2 bg-black/60 p-1 backdrop-blur-sm ${
            align === 'left' ? 'left-6 lg:left-10' : 'right-6 lg:right-10'
          }`}
          style={{ borderColor: accent, borderRadius: 2, width: 80, height: 80 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logo_url} alt="" className="h-full w-full object-contain" />
        </div>
      ) : null}

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
            color: isActive ? accent : '#FFFFFF',
          }}
        >
          {nombre}
        </h3>

        <AnimatePresence>
          {isActive ? (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 max-w-md text-sm leading-relaxed text-white/80"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              {descripcion}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <CodigoUniformeBlock
          codigo={data.codigo_uniforme}
          accent={accent}
          align={align}
          expanded={isActive}
        />

        {isActive && data.contacto_whatsapp?.trim() ? (
          <motion.a
            href={data.contacto_whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-8 inline-block px-6 py-3 text-[0.7rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 700,
              backgroundColor: accent,
              borderRadius: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            UNIRME A {nombre}
          </motion.a>
        ) : null}
      </div>
    </motion.div>
  )
}

function FactionMobileCard({ data, accent }: { data: FaccionMdN; accent: string }) {
  const nombre = data.nombre.trim() || 'FACCIÓN'
  const descripcion =
    data.descripcion?.trim() || 'Información de la facción disponible próximamente.'

  return (
    <div
      className="relative min-h-[72vh] w-full overflow-hidden border border-white/10 text-white shadow-2xl"
      style={{ borderRadius: 2 }}
    >
      {data.imagen_url?.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.imagen_url}
          alt={nombre}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'brightness(0.85)' }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />

      {data.logo_url?.trim() ? (
        <div
          className="absolute left-4 top-4 z-10 h-16 w-16 overflow-hidden border-2 bg-black/60 p-1"
          style={{ borderColor: accent, borderRadius: 2 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logo_url} alt="" className="h-full w-full object-contain" />
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-[72vh] flex-col justify-end p-6">
        <p
          className="text-[0.6rem] tracking-[0.4em] text-white/80"
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
            color: accent,
          }}
        >
          {nombre}
        </h3>
        <p className="mt-3 text-sm text-white/80" style={{ fontFamily: 'Lato, sans-serif' }}>
          {descripcion}
        </p>
        <CodigoUniformeBlock
          codigo={data.codigo_uniforme}
          accent={accent}
          align="left"
          expanded
        />
        {data.contacto_whatsapp?.trim() ? (
          <a
            href={data.contacto_whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block self-start px-5 py-3 text-[0.65rem] uppercase tracking-[0.2em] text-white"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 700,
              backgroundColor: accent,
              borderRadius: 2,
            }}
          >
            UNIRME A {nombre}
          </a>
        ) : null}
      </div>
    </div>
  )
}
