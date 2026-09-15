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
  FECHA_FIN_GRATIS_TEXTO,
  NIVELES_RANKING,
  PORCENTAJES_FACCION,
  PORCENTAJES_POSICION,
  PRECIO_POR_JUGADOR,
  TOPE_BONO_PORCENTAJE,
  fetchEventosTemporada,
  fetchTablaRanking,
  fetchTemporadaActiva,
  formatFechaRanking,
  nivelInfo,
} from '@/lib/ranking'
import {
  CASOS_RANKING,
  FAQ_JUGADORES,
  FAQ_ORGANIZADORES,
} from '@/lib/ranking-contenido'
import { TablaRanking } from './components/TablaRanking'

export const revalidate = 300

const CANONICAL = 'https://www.airnation.online/ranking'
const OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

const PAGE_TITLE = 'Ranking Nacional de Airsoft México | AirNation'
const PAGE_DESCRIPTION =
  'El ranking oficial del airsoft mexicano. Tabla de la temporada, sistema de puntos transparente y cómo hacer que tu evento cuente.'

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

function RankingTableSimple({
  headers,
  rows,
}: {
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <div className="overflow-x-auto border border-[#EEEEEE] bg-white">
      <table className="min-w-full text-left text-[13px]" style={{ fontFamily: "'Lato', sans-serif" }}>
        <thead>
          <tr className="border-b border-[#EEEEEE] bg-[#FAFAFA]">
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3 py-2.5 text-[9px] font-extrabold uppercase tracking-widest text-[#999999]"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 800 }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-[#F4F4F4] last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2.5 text-[#111111]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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

  const jugadoresRankeados = filas.length
  const eventosRankeados = eventos.length

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
                  {temporada?.nombre ?? 'Ranking Nacional'}
                </p>
              </div>
              <h1
                className="font-display font-black uppercase leading-[0.9] text-white"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}
              >
                RANKING
                <br />
                <span className="text-[#CC4B37]">NACIONAL</span>
              </h1>
              <p className="mt-6 max-w-2xl font-body text-base leading-[1.7] text-white/70 sm:text-[1.05rem]">
                Un solo ranking para todo el airsoft mexicano. Cada evento rankeado suma
                puntos y cada punto tiene origen visible.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="border border-white/10 bg-white/5 px-4 py-4">
                  <p className="font-display text-2xl font-black tabular-nums text-white">
                    {temporada ? jugadoresRankeados : '—'}
                  </p>
                  <p className="mt-1 font-body text-[0.7rem] uppercase tracking-[0.12em] text-white/60">
                    Jugadores rankeados
                  </p>
                </div>
                <div className="border border-white/10 bg-white/5 px-4 py-4">
                  <p className="font-display text-2xl font-black tabular-nums text-white">
                    {temporada ? eventosRankeados : '—'}
                  </p>
                  <p className="mt-1 font-body text-[0.7rem] uppercase tracking-[0.12em] text-white/60">
                    Eventos rankeados
                  </p>
                </div>
                <div className="border border-[#CC4B37]/40 bg-[#CC4B37]/10 px-4 py-4">
                  <p className="font-display text-lg font-black uppercase text-[#CC4B37]">
                    Gratis
                  </p>
                  <p className="mt-1 font-body text-[0.7rem] uppercase tracking-[0.12em] text-white/60">
                    Para jugadores
                  </p>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#tabla"
                  className="inline-flex items-center justify-center bg-[#CC4B37] px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                >
                  Ver tabla
                </a>
                <a
                  href="#organizadores"
                  className="inline-flex items-center justify-center border border-solid border-white/35 px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white/90 transition-colors hover:border-white hover:text-white"
                >
                  Organizo eventos
                </a>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {temporada ? (
        <>
          {/* TABLA */}
          <section
            id="tabla"
            className="relative bg-white px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
          >
            <div className="mx-auto max-w-7xl">
              <RevealOnScroll>
                <div className="mb-8 max-w-2xl">
                  <div className="mb-5 flex items-center gap-4">
                    <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                    <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                      Temporada actual
                    </p>
                  </div>
                  <h2
                    className="font-display font-black uppercase leading-[0.9] text-[#111111]"
                    style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                  >
                    TABLA
                    <br />
                    <span className="text-[#CC4B37]">NACIONAL</span>
                  </h2>
                </div>
                <TablaRanking filas={filas} />
                <p className="mt-4 font-body text-sm leading-relaxed text-[#666666]">
                  Cuentan los mejores {temporada.max_resultados} resultados de cada jugador
                  en la temporada, con máximo {temporada.max_recreativos} de nivel recreativo.
                </p>
              </RevealOnScroll>
            </div>
          </section>

          {/* EVENTOS */}
          <section
            id="eventos"
            className="relative bg-[#F4F4F4] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
          >
            <div className="mx-auto max-w-7xl">
              <RevealOnScroll>
                <div className="mb-8 max-w-2xl">
                  <div className="mb-5 flex items-center gap-4">
                    <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                    <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                      {temporada.nombre}
                    </p>
                  </div>
                  <h2
                    className="font-display font-black uppercase leading-[0.9] text-[#111111]"
                    style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                  >
                    EVENTOS DE
                    <br />
                    <span className="text-[#CC4B37]">LA TEMPORADA</span>
                  </h2>
                </div>
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
                                Evento fundador
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
                              Nivel {ev.nivel} · {ni.nombre}
                            </span>
                            <span className="border border-[#EEEEEE] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#666666]">
                              {DISCIPLINA_LABELS[ev.disciplina] ?? ev.disciplina}
                            </span>
                          </div>
                          <p className="mt-4 font-body text-[13px] text-[#111111]">
                            {ev.total_jugadores} jugadores
                          </p>
                          <p className="mt-1 font-body text-[13px] font-bold tabular-nums text-[#CC4B37]">
                            Bolsa {ev.bolsa} pts
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
        className="relative bg-white px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll>
            <div className="mb-8 max-w-2xl">
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Reglas públicas
                </p>
              </div>
              <h2
                className="font-display font-black uppercase leading-[0.9] text-[#111111]"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
              >
                CÓMO SE CALCULAN
                <br />
                <span className="text-[#CC4B37]">LOS PUNTOS</span>
              </h2>
            </div>

            <div className="mb-10 border border-[#EEEEEE] bg-[#F4F4F4] px-5 py-6 sm:px-8">
              <p
                className="text-center text-[14px] font-bold text-[#111111] md:text-[16px]"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                Puntos = Bolsa del evento × % por posición + Bonos
              </p>
              <p
                className="mt-2 text-center text-[13px] text-[#666666]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Bolsa = Puntos por nivel × Factor de tamaño
              </p>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="mb-3 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  Nivel del evento
                </h3>
                <RankingTableSimple
                  headers={['Nivel', 'Nombre', 'Descripción', 'Puntos base']}
                  rows={NIVELES_RANKING.map((n) => [
                    n.nivel,
                    n.nombre,
                    n.descripcion,
                    n.puntos,
                  ])}
                />
              </div>
              <div>
                <h3 className="mb-3 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  Factor de tamaño
                </h3>
                <RankingTableSimple
                  headers={['Jugadores', 'Factor']}
                  rows={FACTORES_TAMANO.map((f) => [f.rango, f.factor])}
                />
              </div>
              <div>
                <h3 className="mb-3 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  Por posición (individual / equipos)
                </h3>
                <RankingTableSimple
                  headers={['Posición', '% de la bolsa']}
                  rows={PORCENTAJES_POSICION.map((p) => [
                    p.posicion,
                    `${p.porcentaje}%`,
                  ])}
                />
              </div>
              <div>
                <h3 className="mb-3 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
                  Por facción
                </h3>
                <RankingTableSimple
                  headers={['Resultado', '% de la bolsa']}
                  rows={PORCENTAJES_FACCION.map((p) => [
                    p.resultado,
                    `${p.porcentaje}%`,
                  ])}
                />
              </div>
            </div>

            <ul className="mt-10 space-y-3 font-body text-[14px] leading-relaxed text-[#444444]">
              <li>
                Bonos declarados antes del evento, con tope de {TOPE_BONO_PORCENTAJE}% de
                la bolsa por jugador.
              </li>
              <li>
                El criterio de posición final lo define el organizador y se publica antes
                del evento.
              </li>
              <li>
                Desempate en la tabla: (1) más primeros lugares, (2) más eventos completos,
                (3) mejor posición en el evento de mayor nivel, (4) resultado más reciente.
              </li>
              <li>El nivel del evento nunca depende de un pago.</li>
            </ul>
          </RevealOnScroll>
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
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Para organizadores
                </p>
              </div>
              <h2
                className="font-display font-black uppercase leading-[0.95] text-white"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
              >
                ¿TIENES PENSADO HACER UN EVENTO? HAZ QUE TUS RESULTADOS CUENTEN.
              </h2>
              <ul className="mt-8 space-y-4">
                {[
                  'Tus jugadores suman puntos en el ranking nacional',
                  'Página pública de resultados con desglose transparente',
                  'Arbitraje y resultados en vivo con el módulo de torneos de AirNation',
                  'Tu evento visible para toda la comunidad AirNation',
                ].map((texto) => (
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
                <p className="font-body text-sm text-white/40 line-through">
                  ${PRECIO_POR_JUGADOR} MXN por jugador rankeado
                </p>
                <p
                  className="mt-2 font-display text-xl font-black uppercase leading-tight text-[#CC4B37] sm:text-2xl"
                >
                  Gratis hasta el {FECHA_FIN_GRATIS_TEXTO}
                </p>
                <p className="mt-4 font-body text-[14px] leading-relaxed text-white/70">
                  Organizadores fundadores conservan $19 por jugador durante toda la Temporada
                  2027.
                </p>
                <a
                  href={CONTACTO_ORGANIZADORES}
                  className="mt-8 inline-flex w-full items-center justify-center bg-[#CC4B37] px-6 py-4 font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 sm:w-auto"
                >
                  Quiero que mi evento cuente
                </a>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* CASOS */}
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
            {CASOS_RANKING.map((caso, i) => (
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
                        Caso real
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 font-body text-[13px] leading-relaxed text-[#666666]">
                    {caso.calculo}
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
            <FaqColumn titulo="Jugadores" items={FAQ_JUGADORES} />
            <FaqColumn titulo="Organizadores" items={FAQ_ORGANIZADORES} />
          </div>
        </div>
      </section>

      {/* TRANSPARENCIA */}
      <section className="border-t border-[#EEEEEE] bg-[#F4F4F4] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-6">
          {[
            'Ventana de corrección de 72 horas',
            'Datos de contacto nunca compartidos entre organizadores',
            'Reglas publicadas antes de cada evento',
          ].map((linea) => (
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
