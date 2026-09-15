import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import {
  CONTACTO_ORGANIZADORES,
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
  EJEMPLOS_RANKING,
  ETIQUETAS,
  FAQ_JUGADORES,
  FAQ_ORGANIZADORES,
  HERO_RANKING,
  PASOS_RANKING,
  REGLAS_EN_CORTO,
  TEXTOS_EVENTOS,
  TEXTOS_ORGANIZADORES,
  TEXTOS_PUNTOS,
  TEXTOS_TABLA,
  TEXTOS_TRANSPARENCIA,
} from '@/lib/ranking-contenido'
import { BadgeCapturaAirNation } from './components/BadgeCapturaAirNation'
import { TablaRanking } from './components/TablaRanking'

export const revalidate = 300

const CANONICAL = 'https://www.airnation.online/ranking'
const OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

const PAGE_TITLE = 'Ranking Nacional de Airsoft México | AirNation'
const PAGE_DESCRIPTION =
  'Juega eventos, suma puntos y compite por ser el número 1 del airsoft en México. Tabla, eventos y cómo se ganan los puntos.'

export const metadata: Metadata = {
  title: {
    absolute: PAGE_TITLE,
  },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: CANONICAL,
    siteName: 'AirNation',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: PAGE_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

function FaqColumn({
  titulo,
  items,
}: {
  titulo: string
  items: { pregunta: string; respuesta: string }[]
}) {
  return (
    <div>
      <p className="mb-4 font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
        {titulo}
      </p>
      <div className="space-y-2">
        {items.map((faq, i) => (
          <details
            key={`${faq.pregunta.slice(0, 32)}-${i}`}
            className="group border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
          >
            <summary
              className="cursor-pointer list-none px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#111111] marker:hidden [&::-webkit-details-marker]:hidden"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 800 }}
            >
              <span className="flex items-start justify-between gap-2">
                {faq.pregunta}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 text-[#CC4B37] transition-transform group-open:rotate-180"
                  aria-hidden
                >
                  <path
                    d="M6 9l6 6 6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </summary>
            <div
              className="border-t border-solid border-[#EEEEEE] bg-white px-4 py-3 text-[14px] leading-relaxed text-[#333333]"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <p>{faq.respuesta}</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
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

  const jugadoresEnTabla = filas.length
  const eventosQueCuentan = eventos.length

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [...FAQ_JUGADORES, ...FAQ_ORGANIZADORES].map((faq) => ({
      '@type': 'Question',
      name: faq.pregunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.respuesta,
      },
    })),
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-an-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative bg-[#111111] px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32">
        <div className="mx-auto max-w-7xl">
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

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="border border-white/10 bg-white/5 px-4 py-4">
                  <p className="font-display text-2xl font-black tabular-nums text-white">
                    {temporada ? jugadoresEnTabla : '—'}
                  </p>
                  <p className="mt-1 font-body text-[0.7rem] uppercase tracking-[0.12em] text-white/60">
                    {HERO_RANKING.statJugadores}
                  </p>
                </div>
                <div className="border border-white/10 bg-white/5 px-4 py-4">
                  <p className="font-display text-2xl font-black tabular-nums text-white">
                    {temporada ? eventosQueCuentan : '—'}
                  </p>
                  <p className="mt-1 font-body text-[0.7rem] uppercase tracking-[0.12em] text-white/60">
                    {HERO_RANKING.statEventos}
                  </p>
                </div>
                <div className="border border-[#CC4B37]/40 bg-[#CC4B37]/10 px-4 py-4">
                  <p className="font-display text-lg font-black uppercase text-[#CC4B37]">
                    Gratis
                  </p>
                  <p className="mt-1 font-body text-[0.7rem] uppercase tracking-[0.12em] text-white/60">
                    {HERO_RANKING.statGratis}
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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
      <section className="relative bg-white px-5 py-10 sm:px-8 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <h2
              className="mb-10 font-display font-black uppercase leading-[0.9] text-[#111111]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              ASÍ
              <br />
              <span className="text-[#CC4B37]">FUNCIONA</span>
            </h2>
          </RevealOnScroll>
          <div className="grid gap-6 md:grid-cols-3">
            {PASOS_RANKING.map((paso, i) => (
              <RevealOnScroll key={paso.titulo} delay={i * 0.05}>
                <article className="flex h-full flex-col border border-[#EEEEEE] bg-[#FAFAFA] p-6">
                  <p
                    className="font-display text-4xl font-black tabular-nums text-[#CC4B37]"
                    style={{ lineHeight: 1 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-4 font-body text-[15px] font-bold text-[#111111]">
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
          {/* TABLA */}
          <section
            id="tabla"
            className="relative bg-[#F4F4F4] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
          >
            <div className="mx-auto max-w-7xl">
              <RevealOnScroll>
                <h2
                  className="mb-8 font-display font-black uppercase leading-[0.9] text-[#111111]"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                >
                  {TEXTOS_TABLA.titulo}
                </h2>
                <TablaRanking filas={filas} />
                <p className="mt-4 font-body text-sm leading-relaxed text-[#666666]">
                  {TEXTOS_TABLA.nota(
                    temporada.max_resultados,
                    temporada.max_recreativos
                  )}
                </p>
              </RevealOnScroll>
            </div>
          </section>

          {/* EVENTOS */}
          <section
            id="eventos"
            className="relative bg-white px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
          >
            <div className="mx-auto max-w-7xl">
              <RevealOnScroll>
                <h2
                  className="mb-8 font-display font-black uppercase leading-[0.9] text-[#111111]"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                >
                  {TEXTOS_EVENTOS.titulo}
                </h2>
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
                          className="group flex h-full flex-col border border-[#EEEEEE] bg-white p-5 transition-colors hover:border-[#CC4B37]/30 hover:bg-[#FAFAFA]"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="font-body text-[15px] font-bold leading-snug text-[#111111] group-hover:text-[#CC4B37]">
                              {ev.nombre}
                            </h3>
                            {ev.es_fundador ? (
                              <span
                                className="shrink-0 bg-[#111111] px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white"
                                style={{ fontFamily: "'Jost', sans-serif" }}
                              >
                                {ETIQUETAS.eventoFundador}
                              </span>
                            ) : null}
                          </div>
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
                          <p className="mt-1 font-body text-[13px] font-bold tabular-nums text-[#CC4B37]">
                            {TEXTOS_EVENTOS.puntosEnJuego(ev.bolsa)}
                          </p>
                        </Link>
                      </RevealOnScroll>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {/* PUNTOS */}
      <section
        id="puntos"
        className="relative bg-[#F4F4F4] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <h2
              className="mb-4 font-display font-black uppercase leading-[0.9] text-[#111111]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {TEXTOS_PUNTOS.titulo}
            </h2>
            <p className="mb-10 max-w-2xl font-body text-[15px] leading-relaxed text-[#666666]">
              {TEXTOS_PUNTOS.intro}
            </p>

            <div className="space-y-12">
              <div>
                <h3 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  {TEXTOS_PUNTOS.tipoTitulo}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {NIVELES_RANKING.map((n) => (
                    <div
                      key={n.nivel}
                      className="border border-[#EEEEEE] bg-white p-4"
                    >
                      <p className="font-body text-[14px] font-bold text-[#111111]">
                        {n.nombre}
                      </p>
                      <p className="mt-2 font-body text-[12px] leading-relaxed text-[#666666]">
                        {n.descripcion}
                      </p>
                      <p className="mt-3 font-display text-2xl font-black tabular-nums text-[#CC4B37]">
                        {n.puntos}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 font-body text-[13px] text-[#666666]">
                  {TEXTOS_PUNTOS.tipoNota}
                </p>
              </div>

              <div>
                <h3 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  {TEXTOS_PUNTOS.tamanoTitulo}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {FACTORES_TAMANO.map((f) => (
                    <div
                      key={f.rango}
                      className="min-w-[140px] flex-1 border border-[#EEEEEE] bg-white px-3 py-3 text-center sm:min-w-0"
                    >
                      <p className="font-body text-[11px] font-bold uppercase text-[#111111]">
                        {f.etiqueta}
                      </p>
                      <p className="mt-1 font-body text-[10px] text-[#999999]">
                        {f.rango} jugadores
                      </p>
                      <p className="mt-2 font-display text-lg font-black text-[#CC4B37]">
                        {f.porcentaje}%
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 font-body text-[13px] text-[#666666]">
                  {TEXTOS_PUNTOS.tamanoNota}
                </p>
                <p className="mt-3 border border-[#EEEEEE] bg-white px-4 py-3 font-body text-[13px] text-[#444444]">
                  {TEXTOS_PUNTOS.ejemploCuenta}
                </p>
              </div>

              <div>
                <h3 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  {TEXTOS_PUNTOS.lugarTitulo}
                </h3>
                <div className="space-y-2">
                  {PORCENTAJES_POSICION.map((p) => (
                    <div
                      key={p.posicion}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="w-24 shrink-0 font-body text-[12px] font-bold text-[#111111]"
                      >
                        {p.posicion}
                      </span>
                      <div className="relative h-7 flex-1 bg-[#EEEEEE]">
                        <div
                          className="absolute inset-y-0 left-0 bg-[#CC4B37]"
                          style={{ width: `${p.porcentaje}%` }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right font-body text-[11px] text-[#666666]">
                        {TEXTOS_PUNTOS.lugarBarra(p.porcentaje)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 font-body text-[13px] text-[#666666]">
                  {TEXTOS_PUNTOS.lugarNota}
                </p>
              </div>

              <div>
                <h3 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  {TEXTOS_PUNTOS.bandosTitulo}
                </h3>
                <div className="space-y-2">
                  {TEXTOS_PUNTOS.bandos.map((b) => (
                    <div key={b.resultado} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 font-body text-[12px] font-bold text-[#111111]">
                        {b.resultado}
                      </span>
                      <div className="relative h-7 flex-1 bg-[#EEEEEE]">
                        <div
                          className="absolute inset-y-0 left-0 bg-[#CC4B37]"
                          style={{ width: `${b.porcentaje}%` }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right font-body text-[11px] text-[#666666]">
                        {TEXTOS_PUNTOS.lugarBarra(b.porcentaje)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 font-body text-[13px] text-[#666666]">
                  {TEXTOS_PUNTOS.bandosNota}
                </p>
              </div>

              <div>
                <h3 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  {TEXTOS_PUNTOS.extraTitulo}
                </h3>
                <div className="border border-[#EEEEEE] bg-white px-5 py-5">
                  <p className="font-body text-[14px] leading-relaxed text-[#333333]">
                    {TEXTOS_PUNTOS.extraTexto}
                  </p>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* REGLAS */}
      <section className="relative bg-white px-5 py-10 sm:px-8 sm:py-14 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <h2
              className="mb-10 font-display font-black uppercase leading-[0.9] text-[#111111]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              LAS REGLAS,
              <br />
              <span className="text-[#CC4B37]">EN CORTO</span>
            </h2>
          </RevealOnScroll>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REGLAS_EN_CORTO.map((regla, i) => (
              <RevealOnScroll key={regla.titulo} delay={i * 0.05}>
                <article className="h-full border border-[#EEEEEE] bg-[#FAFAFA] p-5">
                  <h3 className="font-body text-[14px] font-bold text-[#111111]">
                    {regla.titulo}
                  </h3>
                  <p className="mt-3 font-body text-[13px] leading-relaxed text-[#666666]">
                    {regla.texto}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ORGANIZADORES */}
      <section
        id="organizadores"
        className="relative bg-[#111111] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <RevealOnScroll>
              <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                {TEXTOS_ORGANIZADORES.eyebrow}
              </p>
              <h2
                className="mt-4 font-display font-black uppercase leading-[0.95] text-white"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
              >
                {TEXTOS_ORGANIZADORES.titulo}
              </h2>
              <ul className="mt-8 space-y-4">
                {TEXTOS_ORGANIZADORES.beneficios.map((texto) => (
                  <li key={texto} className="flex gap-3 font-body text-[15px] text-white/75">
                    <span className="mt-1 shrink-0 text-[#CC4B37]" aria-hidden>
                      ✓
                    </span>
                    {texto}
                  </li>
                ))}
              </ul>
            </RevealOnScroll>

            <RevealOnScroll delay={0.1}>
              <div className="border-2 border-[#CC4B37] bg-[#111111] p-6 sm:p-8">
                <p className="font-display text-xl font-black uppercase leading-tight text-[#CC4B37] sm:text-2xl">
                  {TEXTOS_ORGANIZADORES.gratis}
                </p>
                <p className="mt-4 font-body text-[12px] text-white/45">
                  {TEXTOS_ORGANIZADORES.despues}
                </p>
                <div className="mt-4 space-y-0 border border-[#333333]">
                  <div className="border-b border-[#333333] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="text-[9px] font-bold uppercase tracking-widest text-white/80"
                        style={{ fontFamily: "'Jost', sans-serif" }}
                      >
                        {TEXTOS_ORGANIZADORES.tarifaAirnationEtiqueta}
                      </p>
                      <span
                        className="bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                        style={{ fontFamily: "'Jost', sans-serif" }}
                      >
                        {TEXTOS_ORGANIZADORES.tarifaAirnationBadge}
                      </span>
                    </div>
                    <p className="mt-2 font-display text-2xl font-black tabular-nums text-white">
                      ${PRECIO_TARIFA_AIRNATION} MXN
                    </p>
                    <p className="mt-2 font-body text-[13px] leading-relaxed text-white/65">
                      {TEXTOS_ORGANIZADORES.tarifaAirnationTexto}
                    </p>
                  </div>
                  <div className="p-4">
                    <p
                      className="text-[9px] font-bold uppercase tracking-widest text-white/55"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {TEXTOS_ORGANIZADORES.tarifaExternaEtiqueta}
                    </p>
                    <p className="mt-2 font-display text-lg font-black tabular-nums text-white/45">
                      ${PRECIO_TARIFA_ESTANDAR} MXN
                    </p>
                    <p className="mt-2 font-body text-[13px] leading-relaxed text-white/55">
                      {TEXTOS_ORGANIZADORES.tarifaExternaTexto}
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-body text-[14px] leading-relaxed text-white/70">
                  {TEXTOS_ORGANIZADORES.fundador}
                </p>
                <a
                  href={CONTACTO_ORGANIZADORES}
                  className="mt-8 inline-flex w-full items-center justify-center bg-[#CC4B37] px-6 py-4 font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 sm:w-auto"
                >
                  {TEXTOS_ORGANIZADORES.cta}
                </a>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* EJEMPLOS */}
      <section
        id="casos"
        className="relative bg-[#F4F4F4] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <h2
              className="mb-10 font-display font-black uppercase leading-[0.9] text-[#111111]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              ASÍ SE GANAN
              <br />
              <span className="text-[#CC4B37]">LOS PUNTOS</span>
            </h2>
          </RevealOnScroll>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {EJEMPLOS_RANKING.map((caso, i) => (
              <RevealOnScroll key={caso.titulo} delay={i * 0.05}>
                <article className="flex h-full flex-col border border-[#EEEEEE] bg-white p-5">
                  <div className="flex flex-wrap items-start gap-2">
                    <h3 className="font-body text-[14px] font-bold text-[#111111]">
                      {caso.titulo}
                    </h3>
                    {caso.real ? (
                      <span
                        className="shrink-0 bg-[#CC4B37] px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white"
                        style={{ fontFamily: "'Jost', sans-serif" }}
                      >
                        CASO REAL
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 font-body text-[13px] leading-relaxed text-[#666666]">
                    {caso.explicacion}
                  </p>
                  <p className="mt-3 font-body text-[13px] font-bold leading-relaxed text-[#111111]">
                    {caso.resultado}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="relative bg-white px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <h2
              className="mb-10 font-display font-black uppercase leading-[0.9] text-[#111111]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              PREGUNTAS
              <br />
              <span className="text-[#CC4B37]">FRECUENTES</span>
            </h2>
          </RevealOnScroll>
          <div className="grid gap-10 lg:grid-cols-2">
            <FaqColumn titulo="SI JUEGAS" items={FAQ_JUGADORES} />
            <FaqColumn titulo="SI ORGANIZAS" items={FAQ_ORGANIZADORES} />
          </div>
        </div>
      </section>

      {/* TRANSPARENCIA */}
      <section className="border-t border-[#EEEEEE] bg-[#F4F4F4] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-6">
          {TEXTOS_TRANSPARENCIA.map((linea) => (
            <p
              key={linea}
              className="font-body text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#666666]"
            >
              {linea}
            </p>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
