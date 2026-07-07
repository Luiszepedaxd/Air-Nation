'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Check,
  MapPin,
  Clock,
  Users,
  Zap,
} from 'lucide-react'
import { Lightbox } from './components/Lightbox'
import { PhotoPlaceholder } from './components/PhotoPlaceholder'
import { ProtoHeader } from './components/ProtoHeader'
import { PaquetesSection } from './components/PaquetesSection'
import { ScrollCarousel } from './components/ScrollCarousel'
import { ReglasSection } from './components/ReglasSection'
import { StepperPago } from './components/StepperPago'
import {
  CAMPO,
  GALLERY_LABELS,
  CAMPO_GRID_LABELS,
  RESENAS,
} from './constants'
import { jost, jostHeading, lato } from './theme'
import type { ModalidadId, PaqueteId, ReservaState } from './types'

const INITIAL_STATE: ReservaState = {
  paso: 1,
  modalidad: 'gotcha',
  fecha: null,
  horario: '',
  jugadores: 4,
  paquete: null,
  nombre: '',
  telefono: '',
  email: '',
  notas: '',
  cuentaAirNation: false,
  metodoPago: 'tarjeta',
  cargando: false,
  numeroReserva: null,
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.77L10 2.5z"
            fill={i <= full ? '#CC4B37' : 'none'}
            stroke={i <= full ? '#CC4B37' : '#CCCCCC'}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="mb-4 text-[11px] tracking-[0.14em] text-[#111111]"
      style={jostHeading}
    >
      {children}
    </motion.h2>
  )
}

function GotchaOmnilifeContent() {
  const searchParams = useSearchParams()
  const [reservaState, setReservaState] = useState<ReservaState>(INITIAL_STATE)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxLabels, setLightboxLabels] = useState<string[]>(GALLERY_LABELS)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const updateReserva = useCallback((patch: Partial<ReservaState>) => {
    setReservaState((prev) => ({ ...prev, ...patch }))
  }, [])

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
  }, [])

  useEffect(() => {
    const pkg = searchParams.get('paquete') as PaqueteId | null
    if (pkg && ['basico', 'estandar', 'premium'].includes(pkg)) {
      setReservaState((prev) => ({ ...prev, paquete: pkg }))
    }
  }, [searchParams])

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 3000)
    return () => clearTimeout(t)
  }, [toastMsg])

  function openLightbox(labels: string[], index: number) {
    setLightboxLabels(labels)
    setLightboxIndex(index)
  }

  function selectPaquete(modalidad: ModalidadId, id: PaqueteId) {
    updateReserva({ modalidad, paquete: id })
    scrollTo('reservar')
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <ProtoHeader />

      {/* Hero — mismo patrón que CampoHero */}
      <div className="relative w-full">
        <div className="relative h-[240px] w-full overflow-hidden bg-[#111111] md:h-[360px]">
          <PhotoPlaceholder label="Foto de portada" className="h-full w-full border-0" />
          <span
            className="absolute left-3 top-3 bg-[#F4F4F4] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#666666] md:left-4 md:top-4"
            style={jost}
          >
            PÚBLICO
          </span>
          <span
            className="absolute right-3 top-3 bg-[#CC4B37] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white md:right-4 md:top-4"
            style={jost}
          >
            ARENA
          </span>
        </div>

        <div className="border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 pb-6 pt-6 md:px-6 md:pb-8">
          <p
            className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#999999]"
            style={jost}
          >
            {CAMPO.ciudad}
          </p>
          <h1
            className="text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
            style={jost}
          >
            {CAMPO.nombre}
          </h1>
          <p className="mt-2 text-sm text-[#666666]" style={lato}>
            {CAMPO.tagline}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StarRating rating={CAMPO.rating} size={16} />
            <span className="text-2xl font-extrabold text-[#111111]" style={jost}>
              {CAMPO.rating}
            </span>
            <span className="text-sm text-[#666666]" style={lato}>
              ({CAMPO.resenas} reseñas)
            </span>
            <span className="text-[#CCCCCC]">·</span>
            <span className="flex items-center gap-1 text-sm text-[#666666]" style={lato}>
              <Check size={14} className="text-[#CC4B37]" />
              Campo verificado
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollTo('reservar')}
              className="bg-[#CC4B37] px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
              style={jost}
            >
              Reservar ahora
            </button>
            <button
              type="button"
              onClick={() => scrollTo('paquetes')}
              className="border border-[#EEEEEE] px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#111111] transition-colors hover:border-[#CCCCCC]"
              style={jost}
            >
              Ver paquetes
            </button>
          </div>
        </div>
      </div>

      {/* Mini galería — carrusel */}
      <div className="border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 py-4 md:px-6">
        <div className="mx-auto max-w-[960px]">
          <ScrollCarousel label="Galería" showArrows>
            {GALLERY_LABELS.map((label, i) => (
              <motion.button
                key={label}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => openLightbox(GALLERY_LABELS, i)}
                className="snap-start shrink-0"
              >
                <PhotoPlaceholder label={label} className="h-20 w-28 sm:h-24 sm:w-32" compact />
              </motion.button>
            ))}
          </ScrollCarousel>
        </div>
      </div>

      {/* Info rápida — cards scroll en mobile */}
      <div className="border-b border-[#EEEEEE] bg-[#F4F4F4] py-4 md:py-6">
        <div className="mx-auto max-w-[960px] px-4 md:px-6">
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-4 md:gap-4 md:overflow-visible [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
            {[
              { icon: MapPin, label: 'Ubicación', value: CAMPO.ubicacion },
              { icon: Clock, label: 'Horario', value: CAMPO.horario },
              { icon: Users, label: 'Capacidad', value: CAMPO.capacidad },
              { icon: Zap, label: 'Modalidades', value: CAMPO.modalidades },
            ].map(({ icon: Icon, label, value }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="min-w-[200px] shrink-0 snap-start border border-[#EEEEEE] bg-[#FFFFFF] p-4 md:min-w-0"
              >
                <Icon size={18} className="mb-2 text-[#CC4B37]" />
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]" style={jost}>
                  {label}
                </p>
                <p className="mt-1 text-sm text-[#111111]" style={lato}>{value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-4 py-8 md:px-6 md:py-10">
        <div className="mb-12">
          <PaquetesSection
            selectedModalidad={reservaState.modalidad}
            selectedPaquete={reservaState.paquete}
            onSelect={selectPaquete}
          />
        </div>

        {/* Galería */}
        <section className="mb-12">
          <SectionTitle>El campo</SectionTitle>
          <ScrollCarousel className="md:hidden" showArrows>
            {CAMPO_GRID_LABELS.map((label, i) => (
              <motion.button
                key={label}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => openLightbox(CAMPO_GRID_LABELS, i)}
                className="snap-start shrink-0"
              >
                <PhotoPlaceholder label={label} className="h-44 w-56" />
              </motion.button>
            ))}
          </ScrollCarousel>
          <div className="hidden grid-cols-2 gap-3 md:grid md:grid-cols-3">
            {CAMPO_GRID_LABELS.map((label, i) => (
              <motion.button
                key={label}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openLightbox(CAMPO_GRID_LABELS, i)}
                className={`text-left ${i === 0 ? 'md:col-span-2' : ''}`}
              >
                <PhotoPlaceholder
                  label={label}
                  className={`w-full ${i === 0 ? 'aspect-[16/10]' : 'aspect-square'}`}
                />
              </motion.button>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-[#666666]" style={lato}>
            Más de 15,000 m² de campo natural con estructuras tácticas, bunkers y zonas de
            cobertura diseñadas para partidas de alta intensidad.
          </p>
        </section>

        <ReglasSection />

        {/* Reservar */}
        <section id="reservar" className="mb-12 border-t border-[#EEEEEE] pt-10">
          <SectionTitle>Reserva tu fecha</SectionTitle>
          <p className="mb-8 text-sm text-[#666666]" style={lato}>
            Prototipo del flujo de reserva y pago de AirNation ARENA.
          </p>
          <StepperPago
            state={reservaState}
            onChange={updateReserva}
            onToast={showToast}
          />
        </section>

        {/* Reseñas */}
        <section className="mb-12 border-t border-[#EEEEEE] pt-10">
          <SectionTitle>Lo que dicen los jugadores</SectionTitle>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-4xl font-extrabold text-[#111111]" style={jost}>{CAMPO.rating}</p>
              <StarRating rating={CAMPO.rating} size={18} />
              <p className="mt-1 text-sm text-[#666666]" style={lato}>{CAMPO.resenas} reseñas</p>
            </div>
            <div className="flex-1 space-y-2">
              {[
                { stars: 5, pct: 78 },
                { stars: 4, pct: 14 },
                { stars: 3, pct: 5 },
                { stars: 2, pct: 2 },
                { stars: 1, pct: 1 },
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-3 text-xs text-[#666666]" style={lato}>
                  <span className="w-8">{row.stars}★</span>
                  <div className="h-2 flex-1 bg-[#EEEEEE]">
                    <div className="h-full bg-[#CC4B37]" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-8 text-right">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {RESENAS.map((r, i) => (
              <motion.div
                key={r.alias}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border border-[#EEEEEE] bg-[#FFFFFF] p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center bg-[#CC4B37] text-sm font-extrabold text-white"
                    style={jost}
                  >
                    {r.inicial}
                  </div>
                  <div>
                    <p className="font-bold text-[#111111]" style={lato}>{r.alias}</p>
                    <p className="text-[10px] text-[#999999]" style={lato}>{r.fecha}</p>
                  </div>
                </div>
                <StarRating rating={r.rating} size={12} />
                <p className="mt-3 text-sm leading-relaxed text-[#666666]" style={lato}>{r.texto}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-[#999999]" style={lato}>
            Solo jugadores verificados con reserva en AirNation pueden dejar reseña.
          </p>
        </section>

        {/* Mapa */}
        <section className="border-t border-[#EEEEEE] pt-10">
          <SectionTitle>Cómo llegar</SectionTitle>
          <div className="grid gap-6 md:grid-cols-2">
            <PhotoPlaceholder label="Mapa" className="aspect-[4/3] w-full md:aspect-auto md:h-[280px]" />
            <div className="space-y-4 text-sm text-[#666666]" style={lato}>
              <p className="flex items-start gap-2 text-[#111111]">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#CC4B37]" />
                {CAMPO.ubicacion}
              </p>
              <div>
                <h3 className="mb-1 font-bold text-[#111111]">Estacionamiento</h3>
                <p>Gratuito para hasta 40 vehículos.</p>
              </div>
              <div>
                <h3 className="mb-1 font-bold text-[#111111]">Transporte público</h3>
                <p>Rutas 622 y 634 de Mi Macro Periférico.</p>
              </div>
              <a
                href={`https://maps.google.com/?q=${CAMPO.mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center bg-[#111111] px-4 py-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
                style={jost}
              >
                Abrir en Google Maps →
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#EEEEEE] bg-[#F4F4F4] px-4 py-8 text-center md:px-6">
        <p className="text-xs text-[#999999]" style={lato}>
          © 2026 {CAMPO.nombre} · Operado con{' '}
          <Link href="/" className="text-[#CC4B37] hover:underline">
            AirNation ARENA
          </Link>
          {' '}· Prototipo visual
        </p>
      </footer>

      <Lightbox
        labels={lightboxLabels}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={() =>
          setLightboxIndex((i) =>
            i === null ? null : (i - 1 + lightboxLabels.length) % lightboxLabels.length
          )
        }
        onNext={() =>
          setLightboxIndex((i) =>
            i === null ? null : (i + 1) % lightboxLabels.length
          )
        }
      />

      {toastMsg && (
        <div
          className="fixed bottom-6 right-6 z-[110] border border-[#EEEEEE] bg-[#FFFFFF] px-5 py-3 text-sm text-[#111111] shadow-lg"
          style={lato}
        >
          {toastMsg}
        </div>
      )}
    </div>
  )
}

export default function GotchaOmnilifePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF] text-[#666666]" style={lato}>
          Cargando...
        </div>
      }
    >
      <GotchaOmnilifeContent />
    </Suspense>
  )
}
