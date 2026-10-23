'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { FaccionBH2, FaccionesConfig } from '../lib/types'
import { BH2_COLORS, BH2_HEADER_STYLE } from '../lib/theme'
import { CarruselFade } from './CarruselFade'

function colorFaccion(color: string | undefined): string {
  const t = color?.trim() || ''
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t : '#CC4B37'
}

export function FaccionesSection({ config }: { config: FaccionesConfig }) {
  const facciones = (config.facciones ?? []).filter((f) => f?.nombre?.trim())
  if (facciones.length === 0) return null

  const eyebrow = config.eyebrow?.trim() || 'ELIGE TU BANDO'
  const titulo = config.titulo?.trim() || 'FACCIONES'
  const descripcion = config.descripcion?.trim() || ''
  const nota = config.nota?.trim() || ''
  const vs = facciones.length === 2

  return (
    <section
      id="facciones"
      data-section="facciones"
      className="relative w-full overflow-hidden py-16 text-white md:py-24"
      style={{ backgroundColor: BH2_COLORS.jungle }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <p className="text-[0.65rem] tracking-[0.4em] text-[#F2B705] md:text-xs" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}>
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl leading-none md:text-5xl" style={BH2_HEADER_STYLE}>
            {titulo}
          </h2>
          {descripcion ? (
            <p className="mt-4 text-sm leading-relaxed text-white/70 md:text-base" style={{ fontFamily: 'Lato, sans-serif' }}>
              {descripcion}
            </p>
          ) : null}
        </motion.div>

        <div className="md:hidden">
          <FaccionesMobile facciones={facciones} />
        </div>

        <div className="hidden md:block">
          {vs ? (
            <VsLayout facciones={facciones} />
          ) : facciones.length >= 3 ? (
            <CarruselFade fade={BH2_COLORS.jungle}>
              {facciones.map((f, i) => (
                <div key={`${f.id || f.nombre}-${i}`} className="w-[32%] shrink-0 snap-start">
                  <FaccionCard faccion={f} index={i} />
                </div>
              ))}
            </CarruselFade>
          ) : (
            // ponytail: una sola facción se centra; el sello VS es solo para exactamente dos.
            <div className="mx-auto max-w-md">
              <FaccionCard faccion={facciones[0]} index={0} />
            </div>
          )}
        </div>

        {nota ? (
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-white/60" style={{ fontFamily: 'Lato, sans-serif' }}>
            {nota}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function VsLayout({ facciones }: { facciones: FaccionBH2[] }) {
  return (
    <div className="relative grid grid-cols-2 items-stretch gap-16">
      <FaccionCard faccion={facciones[0]} index={0} />
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#CC4B37] text-lg text-white"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}
        >
          VS
        </span>
      </div>
      <FaccionCard faccion={facciones[1]} index={1} />
    </div>
  )
}

function FaccionesMobile({ facciones }: { facciones: FaccionBH2[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const first = el.children[0] as HTMLElement | undefined
      const slideW = first?.offsetWidth ?? el.clientWidth
      const idx = Math.round(el.scrollLeft / Math.max(slideW + 12, 1))
      setActive(Math.min(facciones.length - 1, Math.max(0, idx)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [facciones.length])

  function irA(i: number) {
    const el = ref.current
    const child = el?.children[i] as HTMLElement | undefined
    if (!el || !child) return
    const left = child.offsetLeft - (el.clientWidth - child.offsetWidth) / 2
    el.scrollTo({ left, behavior: 'smooth' })
  }

  return (
    <div>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {facciones.map((f, i) => (
          <div key={`${f.id || f.nombre}-${i}`} className="w-[88%] shrink-0 snap-center">
            <FaccionCard faccion={f} index={i} />
          </div>
        ))}
      </div>
      {facciones.length > 1 ? (
        <>
          <div className="mt-4 flex items-center justify-center gap-2">
            {facciones.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irA(i)}
                aria-label={`Facción ${i + 1}`}
                className="h-2 border-0 p-0"
                style={{
                  width: i === active ? 20 : 8,
                  borderRadius: 4,
                  background: i === active ? '#CC4B37' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
          <p
            className="mt-2 text-center text-[0.55rem] tracking-[0.3em] text-white/45"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            DESLIZA
          </p>
        </>
      ) : null}
    </div>
  )
}

function FaccionCard({ faccion, index }: { faccion: FaccionBH2; index: number }) {
  const color = colorFaccion(faccion.color)
  const agotada = Boolean(faccion.agotada)
  const whatsapp = faccion.contacto_whatsapp?.trim() || ''
  const uniformidad = (faccion.uniformidad ?? []).map((u) => u?.trim()).filter(Boolean)
  const contacto = faccion.contacto_nombre?.trim() || ''
  const cta = `UNIRME A ${faccion.nombre.trim()}${contacto ? ` — ${contacto}` : ''}`

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="flex h-full flex-col overflow-hidden border bg-[#1F2A17]"
      style={{ borderColor: BH2_COLORS.border, borderRadius: 2 }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
        {faccion.imagen_url?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faccion.imagen_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#141A10]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        {faccion.logo_url?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faccion.logo_url} alt="" className="absolute right-3 top-3 h-12 w-12 object-contain" />
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-sm">{faccion.bandera?.trim()}</p>
          <h3 className="text-2xl leading-none text-white" style={BH2_HEADER_STYLE}>
            {faccion.nombre}
          </h3>
          {faccion.subtitulo?.trim() ? (
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/70" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}>
              {faccion.subtitulo.trim()}
            </p>
          ) : null}
        </div>
        {agotada ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="bg-[#CC4B37] px-6 py-2 text-sm tracking-[0.3em] text-white" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}>
              CUPO LLENO
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {faccion.comandante?.trim() ? (
          <Campo label="COMANDANTE EN JEFE" valor={faccion.comandante.trim()} />
        ) : null}
        {faccion.doctrina?.trim() ? <Campo label="DOCTRINA" valor={faccion.doctrina.trim()} /> : null}
        {uniformidad.length > 0 ? (
          <div>
            <p className="text-[0.58rem] tracking-[0.18em] text-[#F2B705]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}>
              UNIFORMIDAD
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {uniformidad.map((item) => (
                <span
                  key={item}
                  className="border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.08em] text-white"
                  style={{ borderColor: color, borderRadius: 2, fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {faccion.descripcion?.trim() ? (
          <p className="text-sm leading-relaxed text-white/70" style={{ fontFamily: 'Lato, sans-serif' }}>
            {faccion.descripcion.trim()}
          </p>
        ) : null}
        {faccion.cupo_texto?.trim() ? (
          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[#C8B27A]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}>
            {faccion.cupo_texto.trim()}
          </p>
        ) : null}
        {whatsapp ? (
          agotada ? (
            <span
              className="mt-auto inline-flex w-full cursor-not-allowed items-center justify-center whitespace-normal bg-[#333] px-4 py-2.5 text-center text-[0.6rem] uppercase leading-snug tracking-[0.12em] text-white/40"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
            >
              {cta}
            </span>
          ) : (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex w-full items-center justify-center whitespace-normal bg-[#25D366] px-4 py-2.5 text-center text-[0.6rem] uppercase leading-snug tracking-[0.12em] text-white transition-opacity hover:opacity-90"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, borderRadius: 2 }}
            >
              {cta}
            </a>
          )
        ) : null}
      </div>
    </motion.article>
  )
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[0.58rem] tracking-[0.18em] text-[#F2B705]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}>
        {label}
      </p>
      <p className="mt-1 text-sm text-white" style={{ fontFamily: 'Lato, sans-serif' }}>
        {valor}
      </p>
    </div>
  )
}
