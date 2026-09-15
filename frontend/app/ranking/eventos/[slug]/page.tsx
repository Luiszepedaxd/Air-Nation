import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Fragment, cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import {
  DISCIPLINA_LABELS,
  MODALIDAD_LABELS,
  TOPE_BONO_PORCENTAJE,
  factorPorJugadores,
  fetchEventoRanking,
  formatFechaRanking,
  hrefJugador,
  humanizarStat,
  nivelInfo,
  type RankingEventoDetalle,
  type RankingResultadoEvento,
} from '@/lib/ranking'

export const revalidate = 300

const OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const FACCION_POSICION_LABELS: Record<string, string> = {
  ganadora: 'Ganadora',
  ganador: 'Ganadora',
  primera: 'Ganadora',
  segunda: 'Segunda',
  tercera: 'Tercera+',
  tercera_mas: 'Tercera+',
  tercera_en_adelante: 'Tercera+',
  resto: 'Tercera+',
}

const getEvento = cache(async (slug: string): Promise<RankingEventoDetalle | null> => {
  const sb = createPublicSupabaseClient()
  return fetchEventoRanking(sb, slug)
})

function canonicalUrl(slug: string) {
  return `https://www.airnation.online/ranking/eventos/${slug}`
}

function etiquetaColumnaPosicion(
  modalidad: string,
  resultado: RankingResultadoEvento
): string {
  if (modalidad === 'facciones' && resultado.resultado_faccion) {
    const key = resultado.resultado_faccion.toLowerCase().replace(/\s+/g, '_')
    return (
      FACCION_POSICION_LABELS[key] ??
      FACCION_POSICION_LABELS[resultado.resultado_faccion] ??
      humanizarStat(resultado.resultado_faccion)
    )
  }
  if (resultado.posicion != null) return String(resultado.posicion)
  return '—'
}

function formatStatValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function lineaBonoObtenido(nombre: string, porcentaje: number, veces: number): string {
  const totalPct = porcentaje * veces
  return `${nombre} × ${veces} = +${totalPct}%`
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const evento = await getEvento(params.slug)
  if (!evento) {
    return {
      title: 'Evento no encontrado | AirNation',
      robots: { index: false, follow: false },
    }
  }

  const title = `${evento.nombre} · Resultados Ranking Nacional | AirNation`
  const description = `Resultados del ${formatFechaRanking(evento.fecha)} en ${evento.ciudad}. ${evento.total_jugadores} jugadores rankeados en el Ranking Nacional de Airsoft México.`
  const canonical = canonicalUrl(evento.slug)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'AirNation',
      locale: 'es_MX',
      type: 'website',
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
    },
  }
}

function FichaCalculo({ evento }: { evento: RankingEventoDetalle }) {
  const ni = nivelInfo(evento.nivel)
  const factor = factorPorJugadores(evento.total_jugadores)
  const puntosNivel = ni.puntos

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-[#EEEEEE] bg-white px-4 py-4">
          <p className="text-[9px] tracking-widest text-[#999999]" style={jost}>
            NIVEL {evento.nivel}
          </p>
          <p className="mt-2 text-[14px] font-bold text-[#111111]" style={lato}>
            {ni.nombre}
          </p>
          <p className="mt-1 text-[13px] tabular-nums text-[#666666]" style={lato}>
            {puntosNivel} pts base
          </p>
        </div>
        <div className="border border-[#EEEEEE] bg-white px-4 py-4">
          <p className="text-[9px] tracking-widest text-[#999999]" style={jost}>
            {evento.total_jugadores} JUGADORES
          </p>
          <p className="mt-2 text-[14px] font-bold text-[#111111]" style={lato}>
            Factor × {factor}
          </p>
        </div>
        <div className="border border-[#CC4B37]/30 bg-white px-4 py-4">
          <p className="text-[9px] tracking-widest text-[#999999]" style={jost}>
            BOLSA
          </p>
          <p className="mt-2 text-[18px] font-bold tabular-nums text-[#CC4B37]" style={lato}>
            {evento.bolsa} pts
          </p>
        </div>
        <div className="border border-[#EEEEEE] bg-white px-4 py-4">
          <p className="text-[9px] tracking-widest text-[#999999]" style={jost}>
            MODALIDAD
          </p>
          <p className="mt-2 text-[14px] font-bold text-[#111111]" style={lato}>
            {MODALIDAD_LABELS[evento.modalidad] ?? evento.modalidad}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[12px] tabular-nums text-[#666666]" style={lato}>
        {puntosNivel} × {factor} = {evento.bolsa} pts
      </p>
    </div>
  )
}

function JugadorCell({ resultado }: { resultado: RankingResultadoEvento }) {
  const perfilHref = hrefJugador(resultado.user_id)
  const esParcial = !resultado.participacion

  const nombreBlock = (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-[#111111]" style={lato}>
          {resultado.nombre_publico}
        </span>
        {!perfilHref ? (
          <span
            className="shrink-0 bg-[#EEEEEE] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[#999999]"
            style={jost}
          >
            SIN RECLAMAR
          </span>
        ) : null}
        {esParcial ? (
          <span
            className="shrink-0 bg-[#EEEEEE] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[#666666]"
            style={jost}
          >
            PARCIAL
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-[11px] text-[#999999]" style={lato}>
        {[resultado.ciudad, resultado.equipo_nombre].filter(Boolean).join(' · ') ||
          '\u00a0'}
      </p>
    </div>
  )

  if (perfilHref) {
    return (
      <Link href={perfilHref} className="block transition-colors hover:text-[#CC4B37]">
        {nombreBlock}
      </Link>
    )
  }

  return nombreBlock
}

function TablaResultados({
  evento,
  resultados,
}: {
  evento: RankingEventoDetalle
  resultados: RankingResultadoEvento[]
}) {
  if (resultados.length === 0) {
    return (
      <p className="font-body text-[14px] text-[#666666]">
        Aún no hay resultados publicados para este evento.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto border border-[#EEEEEE] bg-white">
      <table className="min-w-full text-left" style={lato}>
        <thead>
          <tr className="border-b border-[#EEEEEE] bg-[#FAFAFA]">
            {['#', 'JUGADOR', 'POSICIÓN', 'BONO', 'TOTAL'].map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3 py-2.5 text-[9px] tracking-widest text-[#999999] first:pl-4 last:pr-4 last:text-right"
                style={jost}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resultados.map((r) => {
            const statEntries = Object.entries(r.stats_organizador).filter(
              ([, v]) => v != null && v !== ''
            )

            return (
              <Fragment key={r.id}>
                <tr className="border-b border-[#F4F4F4] align-top">
                  <td className="whitespace-nowrap px-3 py-3 pl-4 text-[13px] font-bold tabular-nums text-[#666666]">
                    {etiquetaColumnaPosicion(evento.modalidad, r)}
                  </td>
                  <td className="min-w-[200px] px-3 py-3">
                    <JugadorCell resultado={r} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[13px] tabular-nums text-[#111111]">
                    {r.puntos_posicion}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[13px] tabular-nums text-[#666666]">
                    {r.puntos_bono > 0 ? `+${r.puntos_bono}` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 pr-4 text-right text-[15px] font-bold tabular-nums text-[#CC4B37]">
                    {r.puntos_total}
                  </td>
                </tr>
                <tr className="border-b border-[#F4F4F4] bg-[#FAFAFA]/80">
                    <td colSpan={5} className="px-4 py-2 pb-4">
                      <details className="group">
                        <summary
                          className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-[0.08em] text-[#666666] marker:hidden [&::-webkit-details-marker]:hidden"
                          style={jost}
                        >
                          <span className="inline-flex items-center gap-2">
                            Ver desglose
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-[#CC4B37] transition-transform group-open:rotate-180"
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
                        <div className="mt-3 space-y-4 pl-0 sm:pl-2">
                          {r.bonos.length > 0 ? (
                            <div>
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#999999]" style={jost}>
                                Bonos obtenidos
                              </p>
                              <ul className="space-y-1 text-[13px] text-[#333333]">
                                {r.bonos.map((b, i) => (
                                  <li key={`${b.nombre}-${i}`}>
                                    {lineaBonoObtenido(b.nombre, b.porcentaje, b.veces)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {statEntries.length > 0 ? (
                            <div>
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#999999]" style={jost}>
                                Estadísticas del organizador
                              </p>
                              <ul className="grid gap-1 sm:grid-cols-2">
                                {statEntries.map(([key, value]) => (
                                  <li
                                    key={key}
                                    className="flex justify-between gap-4 border-b border-[#EEEEEE] py-1 text-[12px]"
                                  >
                                    <span className="text-[#666666]">{humanizarStat(key)}</span>
                                    <span className="font-medium tabular-nums text-[#111111]">
                                      {formatStatValue(value)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-3 text-[11px] leading-relaxed text-[#999999]">
                                Estadísticas registradas por el organizador. No afectan los puntos del
                                ranking.
                              </p>
                            </div>
                          ) : null}
                          {r.bonos.length === 0 && statEntries.length === 0 ? (
                            <p className="text-[12px] text-[#999999]">Sin bonos ni estadísticas adicionales.</p>
                          ) : null}
                        </div>
                      </details>
                    </td>
                  </tr>
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default async function RankingEventoPage({
  params,
}: {
  params: { slug: string }
}) {
  const evento = await getEvento(params.slug)
  if (!evento) notFound()

  const disciplinaLabel =
    DISCIPLINA_LABELS[evento.disciplina] ?? evento.disciplina
  const modalidadLabel = MODALIDAD_LABELS[evento.modalidad] ?? evento.modalidad

  return (
    <main className="min-h-screen overflow-x-hidden bg-an-bg">
      <Navbar />

      <section className="relative bg-white px-5 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb">
            <Link
              href="/ranking#eventos"
              className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37] transition-opacity hover:opacity-80"
            >
              RANKING NACIONAL / EVENTOS
            </Link>
          </nav>

          <h1
            className="mt-6 font-display font-black uppercase leading-[0.95] text-[#111111]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
          >
            {evento.nombre}
          </h1>

          <p className="mt-4 font-body text-[15px] text-[#666666]">
            {formatFechaRanking(evento.fecha)} · {evento.ciudad} · Organiza:{' '}
            {evento.organizador_nombre}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="border border-[#EEEEEE] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#111111]">
              {disciplinaLabel}
            </span>
            <span className="border border-[#EEEEEE] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#666666]">
              {modalidadLabel}
            </span>
            {evento.es_fundador ? (
              <span
                className="bg-[#111111] px-2 py-1 text-[7px] font-bold uppercase tracking-wider text-white"
                style={jost}
              >
                EVENTO FUNDADOR
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t border-[#EEEEEE] bg-[#F4F4F4] px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl space-y-10">
          <div>
            <h2 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
              Ficha de cálculo
            </h2>
            <FichaCalculo evento={evento} />
          </div>

          <div>
            <h2 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
              Criterio de posición final
            </h2>
            <div className="border border-[#EEEEEE] bg-[#F4F4F4] px-5 py-5">
              <p className="text-[14px] leading-relaxed text-[#333333]" style={lato}>
                {evento.criterio_posicion || '—'}
              </p>
              <p className="mt-3 text-[12px] text-[#666666]" style={lato}>
                Definido por el organizador y publicado antes del evento.
              </p>
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
              Bonos declarados
            </h2>
            {evento.bonos.length === 0 ? (
              <p className="text-[14px] text-[#666666]" style={lato}>
                Este evento no declaró bonos.
              </p>
            ) : (
              <ul className="space-y-4 border border-[#EEEEEE] bg-white px-5 py-5">
                {evento.bonos.map((b) => (
                  <li key={b.id} className="border-b border-[#F4F4F4] pb-4 last:border-0 last:pb-0">
                    <p className="text-[14px] font-bold text-[#111111]" style={lato}>
                      {b.nombre}
                      <span className="ml-2 font-semibold text-[#CC4B37]">
                        +{b.porcentaje}% de la bolsa
                      </span>
                    </p>
                    {b.descripcion ? (
                      <p className="mt-1 text-[13px] leading-relaxed text-[#666666]" style={lato}>
                        {b.descripcion}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[12px] text-[#666666]" style={lato}>
              Tope por jugador: {TOPE_BONO_PORCENTAJE}% de la bolsa.
            </p>
          </div>

          <div>
            <h2 className="mb-4 font-body text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#111111]">
              Resultados
            </h2>
            <TablaResultados evento={evento} resultados={evento.resultados} />
          </div>
        </div>
      </section>

      <section className="border-t border-[#EEEEEE] bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-body text-[14px] leading-relaxed text-[#444444]">
            ¿Ves un error en estos resultados? Tienes 72 horas desde la publicación para reportarlo a{' '}
            <a
              href="mailto:info@airnation.online"
              className="font-semibold text-[#CC4B37] underline-offset-2 hover:underline"
            >
              info@airnation.online
            </a>
            .
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
