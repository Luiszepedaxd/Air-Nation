import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowDown,
  FileCheck,
  Flag,
  Lock,
  Scale,
  ShieldCheck,
  Trophy,
} from 'lucide-react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import {
  DISCIPLINA_LABELS,
  FACTORES_TAMANO,
  NIVELES_RANKING,
  PORCENTAJES_POSICION,
  PRECIO_TARIFA_AIRNATION,
  PRECIO_TARIFA_ESTANDAR,
  fetchEventosTemporada,
  fetchTablaRanking,
  fetchTemporadaActiva,
  formatFechaRanking,
  nivelInfo,
} from '@/lib/ranking'
import {
  FAQ_JUGADORES,
  FAQ_ORGANIZADORES,
  HERO_RANKING,
  PASOS_RANKING,
  REGLAS_EN_CORTO,
  TEXTOS_EVENTOS,
  TEXTOS_FAQ,
  TEXTOS_ORGANIZADORES,
  TEXTOS_PUNTOS,
  TEXTOS_REGLAS,
  TEXTOS_TABLA,
} from '@/lib/ranking-contenido'
import { BadgeCapturaAirNation } from './components/BadgeCapturaAirNation'
import { BotonSolicitudEvento } from './components/SolicitudEventoModal'
import { EncabezadoSeccion } from './components/EncabezadoSeccion'
import { FaqRanking } from './components/FaqRanking'
import { IconoEstrella, IconoPersona } from './components/RankingIconos'
import { PodioRanking } from './components/PodioRanking'
import { TablaRanking } from './components/TablaRanking'

export const revalidate = 300

const SECTION_PY = 'relative px-5 py-14 sm:px-8 sm:py-20 lg:py-24'
const MAX_PUNTOS_ESCALERA = 300
const ALTURA_ESCALERA = 220
const OPACIDAD_ESCALERA = [0.45, 0.6, 0.75, 0.9, 1] as const

const CANONICAL = 'https://www.airnation.online/ranking'
const OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

const PAGE_TITLE = 'Ranking Nacional de Airsoft México | AirNation'
const PAGE_DESCRIPTION =
  'Juega eventos, suma puntos y compite por ser el número 1 del airsoft en México. Tabla, eventos y cómo se ganan los puntos.'

const REGLA_ICONOS = [Trophy, FileCheck, Scale, Flag, Lock, ShieldCheck] as const

const HERO_GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
}

const jostSub = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const CARD = 'border border-[#E5E5E5] bg-white'

function esTopTresLugar(posicion: string): boolean {
  return posicion.startsWith('1º') || posicion.startsWith('2º') || posicion.startsWith('3º')
}

function ChipOrden({ texto }: { texto: string }) {
  return (
    <p className="mb-4 flex items-center gap-1.5 text-xs font-bold text-[#CC4B37] md:hidden">
      <ArrowDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      {texto}
    </p>
  )
}

function SubtituloBloque({ children }: { children: string }) {
  return (
    <h3 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#111111]">
      {children}
    </h3>
  )
}

function BarraLugar({
  etiqueta,
  porcentaje,
  solida,
}: {
  etiqueta: string
  porcentaje: number
  solida: boolean
}) {
  return (
    <>
      <div className="hidden items-center gap-3 md:flex">
        <span className="w-32 shrink-0 text-sm font-bold text-[#111111]">{etiqueta}</span>
        <div className="relative h-7 flex-1 bg-[#E9E9E9]">
          <div
            className={`absolute inset-y-0 left-0 bg-[#CC4B37] ${solida ? '' : 'opacity-60'}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <span className="w-40 shrink-0 text-right text-sm text-[#111111]">
          {TEXTOS_PUNTOS.lugarBarra(porcentaje)}
        </span>
      </div>
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-[#111111]">{etiqueta}</span>
          <span className="shrink-0 text-xs text-[#666666]">
            {TEXTOS_PUNTOS.lugarBarra(porcentaje)}
          </span>
        </div>
        <div className="mt-2 h-2 w-full bg-[#E9E9E9]">
          <div
            className={`h-full bg-[#CC4B37] ${solida ? '' : 'opacity-60'}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    </>
  )
}

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: CANONICAL,
    siteName: 'AirNation',
    locale: 'es_MX',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: PAGE_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export default async function RankingPage() {
  const sb = createPublicSupabaseClient()
  const temporada = await fetchTemporadaActiva(sb)
  const [filas, eventos] = temporada
    ? await Promise.all([
        fetchTablaRanking(sb, temporada.id),
        fetchEventosTemporada(sb, temporada.id),
      ])
    : [[], []]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [...FAQ_JUGADORES, ...FAQ_ORGANIZADORES].map((faq) => ({
      '@type': 'Question',
      name: faq.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: faq.respuesta },
    })),
  }

  const numPuntos = temporada ? '04' : '02'
  const numReglas = temporada ? '05' : '03'
  const numOrg = temporada ? '06' : '04'
  const numFaq = temporada ? '07' : '05'

  return (
    <main className="min-h-screen overflow-x-hidden bg-an-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />

      {/* HERO */}
      <section
        className="relative overflow-hidden border-b-4 border-[#CC4B37] bg-[#111111] px-5 pb-14 pt-24 sm:px-8 sm:pb-16 sm:pt-28"
        style={HERO_GRID_STYLE}
      >
        <div
          className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 select-none font-display font-black leading-none text-transparent lg:block"
          style={{
            fontSize: '22rem',
            WebkitTextStroke: '2px rgba(204,75,55,0.35)',
          }}
          aria-hidden
        >
          1
        </div>
        <div className="relative mx-auto max-w-7xl">
          <RevealOnScroll>
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  {temporada?.nombre ?? HERO_RANKING.titulo}
                </p>
              </div>
              <h1
                className="font-display font-black uppercase leading-[0.9] text-white"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}
              >
                {HERO_RANKING.titulo.split(' ')[0]}
                <br />
                <span className="text-[#CC4B37]">
                  {HERO_RANKING.titulo.split(' ').slice(1).join(' ')}
                </span>
              </h1>
              <p className="mt-6 max-w-2xl font-body text-base leading-[1.7] text-white/70 sm:text-[1.05rem]">
                {HERO_RANKING.subtitulo}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#tabla"
                  className="inline-flex items-center justify-center bg-[#CC4B37] px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                >
                  {HERO_RANKING.botonTabla}
                </a>
                <a
                  href="#organizadores"
                  className="inline-flex items-center justify-center border border-solid border-white/35 px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white/90 transition-colors hover:border-white hover:text-white"
                >
                  {HERO_RANKING.botonOrganizador}
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ASÍ FUNCIONA */}
      <section className={`${SECTION_PY} bg-white`}>
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <EncabezadoSeccion
              numero="01"
              eyebrow="Así funciona"
              titulo={
                <>
                  ASÍ <span className="text-[#CC4B37]">FUNCIONA</span>
                </>
              }
            />
          </RevealOnScroll>
          <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            <div
              className="absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-[#EEEEEE] md:block"
              aria-hidden
            />
            {PASOS_RANKING.map((paso, i) => (
              <RevealOnScroll key={paso.titulo} delay={i * 0.05}>
                <article className="relative flex flex-col items-center text-center md:items-start md:text-left">
                  <div className="relative z-[1] flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#CC4B37] bg-white font-display text-xl font-black text-[#CC4B37]">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3
                    className="mt-5 text-[15px] font-bold text-[#111111]"
                    style={jostSub}
                  >
                    {paso.titulo}
                  </h3>
                  <p className="mt-3 font-body text-[14px] leading-relaxed text-[#666666]">
                    {paso.texto}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {temporada ? (
        <>
          <section id="tabla" className={`${SECTION_PY} bg-[#F4F4F4]`}>
            <div className="mx-auto max-w-7xl">
              <RevealOnScroll>
                <EncabezadoSeccion
                  numero="02"
                  eyebrow={TEXTOS_TABLA.eyebrow}
                  titulo={TEXTOS_TABLA.titulo}
                  subtitulo={TEXTOS_TABLA.subtitulo}
                />
                <PodioRanking filas={filas} />
                <TablaRanking filas={filas} />
                <p className="mt-4 font-body text-sm leading-relaxed text-[#666666]">
                  {TEXTOS_TABLA.nota(temporada.max_resultados, temporada.max_recreativos)}
                </p>
              </RevealOnScroll>
            </div>
          </section>

          <section id="eventos" className={`${SECTION_PY} bg-white`}>
            <div className="mx-auto max-w-7xl">
              <RevealOnScroll>
                <EncabezadoSeccion
                  numero="03"
                  eyebrow={TEXTOS_EVENTOS.eyebrow}
                  titulo={TEXTOS_EVENTOS.titulo}
                  subtitulo={TEXTOS_EVENTOS.subtitulo}
                />
              </RevealOnScroll>
              {eventos.length === 0 ? (
                <p className="font-body text-[#666666]">
                  Aún no hay eventos publicados en esta temporada.
                </p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {eventos.map((ev, i) => {
                    const ni = nivelInfo(ev.nivel)
                    return (
                      <RevealOnScroll key={ev.id} delay={i * 0.05}>
                        <Link
                          href={`/ranking/eventos/${ev.slug}`}
                          className="group flex h-full flex-col border border-[#EEEEEE] border-l-[3px] border-l-[#CC4B37] bg-white p-5 transition-colors hover:border-[#111111] hover:border-l-[#CC4B37]"
                        >
                          <h3 className="font-body text-[15px] font-bold leading-snug text-[#111111] group-hover:text-[#CC4B37]">
                            {ev.nombre}
                          </h3>
                          <p className="mt-2 font-body text-[13px] text-[#666666]">
                            {formatFechaRanking(ev.fecha)} · {ev.ciudad}
                          </p>
                          <p className="mt-1 font-body text-[12px] text-[#999999]">
                            {ev.organizador_nombre}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="border border-[#EEEEEE] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#111111]">
                              {ni.nombre}
                            </span>
                            <span className="border border-[#EEEEEE] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#666666]">
                              {DISCIPLINA_LABELS[ev.disciplina] ?? ev.disciplina}
                            </span>
                            {ev.metodo_captura === 'airnation' ? (
                              <BadgeCapturaAirNation />
                            ) : null}
                          </div>
                          <p className="mt-4 font-body text-[13px] text-[#111111]">
                            {TEXTOS_EVENTOS.jugadores(ev.total_jugadores)}
                          </p>
                          <p className="mt-1 font-display text-xl font-black tabular-nums text-[#CC4B37]">
                            {TEXTOS_EVENTOS.puntosEnJuego(ev.bolsa)}
                          </p>
                        </Link>
                      </RevealOnScroll>
                    )
                  })}
                </div>
              )}
              <a
                href="#organizadores"
                className="mt-8 inline-block tracking-[0.14em] text-[#CC4B37] hover:underline"
                style={jostSub}
              >
                {TEXTOS_EVENTOS.linkOrganizar}
              </a>
            </div>
          </section>
        </>
      ) : null}

      {/* PUNTOS */}
      <section id="puntos" className={`${SECTION_PY} bg-[#F4F4F4]`}>
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <EncabezadoSeccion
              numero={numPuntos}
              eyebrow="Puntos"
              titulo={TEXTOS_PUNTOS.titulo}
              subtitulo={TEXTOS_PUNTOS.intro}
            />

            <div className="space-y-14">
              <div>
                <SubtituloBloque>{TEXTOS_PUNTOS.tipoTitulo}</SubtituloBloque>
                <div className="hidden items-end gap-3 md:grid md:grid-cols-5">
                  {NIVELES_RANKING.map((n, i) => (
                    <div
                      key={n.nivel}
                      className={`flex flex-col items-center px-3 pb-4 pt-6 ${CARD}`}
                    >
                      <p className="font-display text-2xl font-black tabular-nums text-[#111111]">
                        {n.puntos}
                      </p>
                      <div
                        className="mt-3 w-full bg-[#CC4B37]"
                        style={{
                          height: `${(n.puntos / MAX_PUNTOS_ESCALERA) * ALTURA_ESCALERA}px`,
                          opacity: OPACIDAD_ESCALERA[i] ?? 1,
                        }}
                      />
                      <p className="mt-4 text-center text-sm font-bold text-[#111111]">
                        {n.nombre}
                      </p>
                      <p className="mt-2 text-center text-xs leading-relaxed text-[#666666]">
                        {n.descripcion}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="md:hidden">
                  <ChipOrden texto={TEXTOS_PUNTOS.ordenMenosAMas} />
                  <div className="flex flex-col gap-4">
                    {NIVELES_RANKING.map((n, i) => (
                      <div key={n.nivel} className={`p-4 ${CARD}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[#111111]">{n.nombre}</p>
                          <p className="font-display text-xl font-black text-[#111111]">
                            {n.puntos}
                          </p>
                        </div>
                        <div className="mt-3 h-2 w-full bg-[#EEEEEE]">
                          <div
                            className="h-full bg-[#CC4B37]"
                            style={{
                              width: `${(n.puntos / MAX_PUNTOS_ESCALERA) * 100}%`,
                              opacity: OPACIDAD_ESCALERA[i] ?? 1,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-[#666666]">{n.descripcion}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#555555]">{TEXTOS_PUNTOS.tipoNota}</p>
              </div>

              <div>
                <SubtituloBloque>{TEXTOS_PUNTOS.tamanoTitulo}</SubtituloBloque>
                <div className="hidden gap-3 md:grid md:grid-cols-5">
                  {FACTORES_TAMANO.map((f, idx) => (
                    <div key={f.rango} className={`px-4 py-4 ${CARD}`}>
                      <div className="flex gap-0.5 text-[#CC4B37]">
                        {Array.from({ length: idx + 1 }).map((_, j) => (
                          <IconoPersona key={j} />
                        ))}
                      </div>
                      <p className="mt-3 text-sm font-bold text-[#111111]">{f.etiqueta}</p>
                      <p className="mt-1 text-xs text-[#666666]">{f.rango} jugadores</p>
                      <p className="mt-2 font-display text-2xl font-black text-[#111111]">
                        {f.porcentaje}%
                      </p>
                      <div className="mt-3 h-1.5 w-full bg-[#EEEEEE]">
                        <div
                          className="h-full bg-[#CC4B37]"
                          style={{ width: `${(f.porcentaje / 150) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="md:hidden">
                  <ChipOrden texto={TEXTOS_PUNTOS.ordenMenosAMas} />
                  <div className="flex flex-col gap-4">
                    {FACTORES_TAMANO.map((f, idx) => (
                      <div key={f.rango} className={`p-4 ${CARD}`}>
                        <div className="flex items-center gap-3">
                          <div className="flex shrink-0 gap-0.5 text-[#CC4B37]">
                            {Array.from({ length: idx + 1 }).map((_, j) => (
                              <IconoPersona key={j} />
                            ))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#111111]">{f.etiqueta}</p>
                            <p className="text-xs text-[#666666]">{f.rango} jugadores</p>
                          </div>
                          <p className="shrink-0 font-display text-xl font-black text-[#111111]">
                            {f.porcentaje}%
                          </p>
                        </div>
                        <div className="mt-3 h-2 w-full bg-[#EEEEEE]">
                          <div
                            className="h-full bg-[#CC4B37]"
                            style={{
                              width: `${(f.porcentaje / 150) * 100}%`,
                              opacity: OPACIDAD_ESCALERA[idx] ?? 1,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#555555]">{TEXTOS_PUNTOS.tamanoNota}</p>
                <p className="mt-3 border border-[#E5E5E5] border-l-[3px] border-l-[#CC4B37] bg-white px-4 py-3 text-sm text-[#111111]">
                  {TEXTOS_PUNTOS.ejemploCuenta}
                </p>
              </div>

              <div>
                <SubtituloBloque>{TEXTOS_PUNTOS.lugarTitulo}</SubtituloBloque>
                <ChipOrden texto={TEXTOS_PUNTOS.ordenMasAMenos} />
                <div className="space-y-4">
                  {PORCENTAJES_POSICION.map((p) => (
                    <BarraLugar
                      key={p.posicion}
                      etiqueta={p.posicion}
                      porcentaje={p.porcentaje}
                      solida={esTopTresLugar(p.posicion)}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#555555]">{TEXTOS_PUNTOS.lugarNota}</p>
              </div>

              <div>
                <SubtituloBloque>{TEXTOS_PUNTOS.bandosTitulo}</SubtituloBloque>
                <div className="space-y-4">
                  {TEXTOS_PUNTOS.bandos.map((b) => (
                    <BarraLugar
                      key={b.resultado}
                      etiqueta={b.resultado}
                      porcentaje={b.porcentaje}
                      solida={false}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#555555]">{TEXTOS_PUNTOS.bandosNota}</p>
              </div>

              <div>
                <SubtituloBloque>{TEXTOS_PUNTOS.extraTitulo}</SubtituloBloque>
                <div className="flex gap-4 border border-[#E5E5E5] border-l-[3px] border-l-[#CC4B37] bg-white px-5 py-5">
                  <IconoEstrella className="shrink-0 text-[#CC4B37]" />
                  <p className="text-sm leading-relaxed text-[#111111]">
                    {TEXTOS_PUNTOS.extraTexto}
                  </p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* REGLAS */}
      <section className={`${SECTION_PY} bg-white`}>
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <EncabezadoSeccion
              numero={numReglas}
              eyebrow={TEXTOS_REGLAS.eyebrow}
              titulo={TEXTOS_REGLAS.titulo}
              subtitulo={TEXTOS_REGLAS.subtitulo}
            />
          </RevealOnScroll>
          <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto -mx-4 px-4 pb-2 sm:hidden">
            {REGLAS_EN_CORTO.map((regla, i) => {
              const Icon = REGLA_ICONOS[i] ?? Trophy
              return (
                <article
                  key={regla.titulo}
                  className="w-[82%] shrink-0 snap-start border border-[#EEEEEE] bg-white p-5"
                >
                  <Icon className="h-6 w-6 text-[#CC4B37]" strokeWidth={2} aria-hidden />
                  <h3 className="mt-4 text-base font-bold text-[#111111]">{regla.titulo}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#555555]">{regla.texto}</p>
                </article>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-[#999999] sm:hidden">Desliza →</p>
          <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {REGLAS_EN_CORTO.map((regla, i) => {
              const Icon = REGLA_ICONOS[i] ?? Trophy
              return (
                <RevealOnScroll key={regla.titulo} delay={i * 0.05}>
                  <article className="h-full border border-[#EEEEEE] bg-white p-5 transition-colors hover:border-[#111111]">
                    <Icon className="h-6 w-6 text-[#CC4B37]" strokeWidth={2} aria-hidden />
                    <h3 className="mt-4 text-base font-bold text-[#111111]">{regla.titulo}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#555555]">{regla.texto}</p>
                  </article>
                </RevealOnScroll>
              )
            })}
          </div>
        </div>
      </section>

      {/* ORGANIZADORES */}
      <section
        id="organizadores"
        className={`${SECTION_PY} border-t-4 border-[#CC4B37] bg-[#111111]`}
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <RevealOnScroll>
              <EncabezadoSeccion
                numero={numOrg}
                eyebrow={TEXTOS_ORGANIZADORES.eyebrow}
                titulo={TEXTOS_ORGANIZADORES.titulo}
                subtitulo={TEXTOS_ORGANIZADORES.subtitulo}
                oscuro
              />
              <ul className="mt-2 space-y-4">
                {TEXTOS_ORGANIZADORES.beneficios.map((texto) => (
                  <li key={texto} className="flex gap-3 text-base text-white/80">
                    <span className="mt-1 shrink-0 text-[#CC4B37]" aria-hidden>
                      ✓
                    </span>
                    {texto}
                  </li>
                ))}
              </ul>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="bg-white p-6 sm:p-8">
                <p className="font-display text-xl font-black uppercase leading-tight text-[#CC4B37] sm:text-2xl">
                  {TEXTOS_ORGANIZADORES.gratis}
                </p>
                <p className="mt-4 font-body text-[12px] text-[#666666]">
                  {TEXTOS_ORGANIZADORES.despues}
                </p>
                <div className="mt-4 space-y-0 border border-[#EEEEEE]">
                  <div className="border-b border-[#EEEEEE] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="text-[9px] font-bold uppercase tracking-widest text-[#111111]"
                        style={jostSub}
                      >
                        {TEXTOS_ORGANIZADORES.tarifaAirnationEtiqueta}
                      </p>
                      <span
                        className="bg-[#111111] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                        style={jostSub}
                      >
                        {TEXTOS_ORGANIZADORES.tarifaAirnationBadge}
                      </span>
                    </div>
                    <p className="mt-2 font-display text-2xl font-black tabular-nums text-[#111111]">
                      ${PRECIO_TARIFA_AIRNATION} MXN
                    </p>
                    <p className="mt-2 font-body text-[13px] leading-relaxed text-[#666666]">
                      {TEXTOS_ORGANIZADORES.tarifaAirnationTexto}
                    </p>
                  </div>
                  <div className="p-4">
                    <p
                      className="text-[9px] font-bold uppercase tracking-widest text-[#666666]"
                      style={jostSub}
                    >
                      {TEXTOS_ORGANIZADORES.tarifaExternaEtiqueta}
                    </p>
                    <p className="mt-2 font-display text-lg font-black tabular-nums text-[#999999]">
                      ${PRECIO_TARIFA_ESTANDAR} MXN
                    </p>
                    <p className="mt-2 font-body text-[13px] leading-relaxed text-[#666666]">
                      {TEXTOS_ORGANIZADORES.tarifaExternaTexto}
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-body text-[14px] leading-relaxed text-[#444444]">
                  {TEXTOS_ORGANIZADORES.fundador}
                </p>
                <BotonSolicitudEvento
                  origen="ranking"
                  className="mt-8 inline-flex w-full items-center justify-center bg-[#CC4B37] px-6 py-4 font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#B03F2E] sm:w-auto"
                />
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${SECTION_PY} bg-[#F4F4F4]`}>
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <EncabezadoSeccion
              numero={numFaq}
              eyebrow={TEXTOS_FAQ.eyebrow}
              titulo={TEXTOS_FAQ.titulo}
            />
          </RevealOnScroll>
          <FaqRanking jugadores={FAQ_JUGADORES} organizadores={FAQ_ORGANIZADORES} />
        </div>
      </section>

      <Footer />
    </main>
  )
}
