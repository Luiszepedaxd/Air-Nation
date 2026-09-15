import Link from 'next/link'
import {
  formatFechaRanking,
  humanizarStat,
  type RankingHistorialJugador,
} from '@/lib/ranking'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const FACCION_LABELS: Record<string, string> = {
  ganadora: 'Facción ganadora',
  ganador: 'Facción ganadora',
  primera: 'Facción ganadora',
  segunda: 'Segunda facción',
  tercera: 'Tercera facción en adelante',
  tercera_mas: 'Tercera facción en adelante',
  tercera_en_adelante: 'Tercera facción en adelante',
  resto: 'Tercera facción en adelante',
}

function etiquetaResultado(
  posicion: number | null,
  resultadoFaccion: string | null
): string {
  if (posicion != null) return `${posicion}º lugar`
  if (resultadoFaccion) {
    const key = resultadoFaccion.toLowerCase().replace(/\s+/g, '_')
    return (
      FACCION_LABELS[key] ??
      FACCION_LABELS[resultadoFaccion] ??
      humanizarStat(resultadoFaccion)
    )
  }
  return '—'
}

function lineaBono(nombre: string, porcentaje: number, veces: number): string {
  return `${nombre} × ${veces} (+${porcentaje}% c/u)`
}

type Props = {
  historial: RankingHistorialJugador
}

export function RankingJugadorSection({ historial }: Props) {
  const posicionDisplay =
    historial.posicion_actual != null ? `#${historial.posicion_actual}` : '—'

  return (
    <section className="mx-auto max-w-[960px] px-4 pb-8 md:px-6 md:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEEEE] pb-3">
        <h2 className="text-[13px] tracking-[0.06em] text-[#111111]" style={jost}>
          Ranking nacional
        </h2>
        <Link
          href="/ranking"
          className="text-[11px] tracking-[0.08em] text-[#CC4B37] transition-colors hover:text-[#111111]"
          style={jost}
        >
          Ver tabla →
        </Link>
      </div>

      <div
        className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border border-[#EEEEEE] bg-[#FAFAFA] px-4 py-4"
        style={lato}
      >
        <span className="text-[28px] font-extrabold tabular-nums leading-none text-[#CC4B37]">
          {posicionDisplay}
        </span>
        <span className="text-[14px] text-[#999999]">·</span>
        <span className="text-[15px] font-bold tabular-nums text-[#111111]">
          {historial.puntos_actuales} PTS
        </span>
        {historial.temporada_nombre ? (
          <>
            <span className="text-[14px] text-[#999999]">·</span>
            <span className="text-[13px] text-[#666666]">{historial.temporada_nombre}</span>
          </>
        ) : null}
      </div>

      <ul className="mt-6 space-y-4">
        {historial.resultados.map((r) => {
          const esParcial = !r.participacion
          return (
            <li
              key={`${r.evento_slug}-${r.fecha}`}
              className="border border-[#EEEEEE] bg-white px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/ranking/eventos/${r.evento_slug}`}
                    className="text-[15px] font-semibold text-[#111111] transition-colors hover:text-[#CC4B37]"
                    style={lato}
                  >
                    {r.evento_nombre}
                  </Link>
                  <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                    {formatFechaRanking(r.fecha)} · Nivel {r.nivel} · {r.total_jugadores}{' '}
                    jugadores
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-[#333333]" style={lato}>
                      {etiquetaResultado(r.posicion, r.resultado_faccion)}
                    </span>
                    {esParcial ? (
                      <span
                        className="shrink-0 bg-[#EEEEEE] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[#666666]"
                        style={jost}
                      >
                        PARCIAL
                      </span>
                    ) : null}
                  </div>
                </div>
                <span
                  className="shrink-0 text-[18px] font-bold tabular-nums text-[#CC4B37]"
                  style={lato}
                >
                  {r.puntos_total}
                </span>
              </div>

              <details className="group mt-3 border-t border-[#F4F4F4] pt-3">
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
                <div className="mt-3 space-y-3" style={lato}>
                  <p className="text-[13px] text-[#333333]">
                    {r.puntos_posicion} pts por posición + {r.puntos_bono} pts de bono ={' '}
                    {r.puntos_total} pts
                  </p>
                  {r.bonos.length > 0 ? (
                    <ul className="space-y-1 text-[12px] text-[#666666]">
                      {r.bonos.map((b, i) => (
                        <li key={`${b.nombre}-${i}`}>
                          {lineaBono(b.nombre, b.porcentaje, b.veces)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </details>
            </li>
          )
        })}
      </ul>

      <p className="mt-6 text-center text-[12px] text-[#666666]" style={lato}>
        Cada punto tiene origen visible.{' '}
        <Link
          href="/ranking#puntos"
          className="font-medium text-[#CC4B37] underline-offset-2 hover:underline"
        >
          Consulta el sistema de puntos →
        </Link>
      </p>
    </section>
  )
}
