import Link from 'next/link'
import type { RankingFila } from '@/lib/ranking'
import { hrefJugador } from '@/lib/ranking'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type Props = {
  filas: RankingFila[]
  compacta?: boolean
  resaltarUserId?: string | null
}

function FilaContenido({
  fila,
  compacta,
  resaltarUserId,
}: {
  fila: RankingFila
  compacta?: boolean
  resaltarUserId?: string | null
}) {
  const esTop3 = fila.posicion >= 1 && fila.posicion <= 3
  const resaltada = resaltarUserId != null && resaltarUserId === fila.user_id
  const perfilHref = hrefJugador(fila.user_id)

  const rowInner = (
    <>
      <span
        className={`col-span-1 text-[13px] font-bold tabular-nums ${
          esTop3 ? 'text-[#CC4B37]' : 'text-[#CCCCCC]'
        }`}
        style={lato}
      >
        {fila.posicion}
      </span>
      <div className="col-span-6 min-w-0 sm:col-span-7">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={`truncate text-[13px] ${
              esTop3 ? 'font-bold text-[#111111]' : 'font-semibold text-[#111111]'
            }`}
            style={lato}
          >
            {fila.nombre_publico}
          </p>
          {resaltada ? (
            <span
              className="shrink-0 bg-[#CC4B37] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-white"
              style={jost}
            >
              TÚ
            </span>
          ) : null}
          {!perfilHref ? (
            <span
              className="shrink-0 bg-[#EEEEEE] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[#999999]"
              style={jost}
            >
              SIN RECLAMAR
            </span>
          ) : null}
        </div>
        {fila.ciudad ? (
          <p className="truncate text-[10px] text-[#999999]" style={lato}>
            {fila.ciudad}
          </p>
        ) : null}
      </div>
      {!compacta ? (
        <span
          className="col-span-2 hidden text-center text-[13px] tabular-nums text-[#666666] sm:block"
          style={lato}
        >
          {fila.eventos_contados}
        </span>
      ) : null}
      <span
        className={`col-span-5 text-right text-[15px] font-bold tabular-nums text-[#CC4B37] sm:col-span-2 ${
          compacta ? 'col-span-5' : ''
        }`}
        style={lato}
      >
        {fila.puntos}
      </span>
    </>
  )

  const rowClass = `grid grid-cols-12 items-center px-3 py-3 md:px-4 ${
    fila.posicion === 1 ? 'border-l-[3px] border-l-[#CC4B37]' : ''
  } ${resaltada ? 'bg-[#CC4B37]/5' : esTop3 ? 'bg-[#FAFAFA]/50' : ''}`

  if (perfilHref) {
    return (
      <Link
        href={perfilHref}
        className={`${rowClass} grid transition-colors hover:bg-[#FAFAFA]`}
      >
        {rowInner}
      </Link>
    )
  }

  return <div className={`${rowClass} grid`}>{rowInner}</div>
}

export function TablaRanking({ filas, compacta, resaltarUserId }: Props) {
  if (filas.length === 0) {
    return (
      <div className="border border-[#EEEEEE] bg-white px-4 py-10 text-center">
        <p className="text-[13px] text-[#999999]" style={lato}>
          La tabla se llena con el primer evento rankeado de la temporada.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[#EEEEEE] bg-white">
      <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#FAFAFA] px-3 py-2.5 md:px-4">
        <span style={jost} className="col-span-1 text-[9px] tracking-widest text-[#999999]">
          #
        </span>
        <span style={jost} className="col-span-6 text-[9px] tracking-widest text-[#999999] sm:col-span-7">
          JUGADOR
        </span>
        {!compacta ? (
          <span
            style={jost}
            className="col-span-2 hidden text-center text-[9px] tracking-widest text-[#999999] sm:block"
          >
            EVENTOS
          </span>
        ) : null}
        <span
          style={jost}
          className={`col-span-5 text-right text-[9px] tracking-widest text-[#CC4B37] sm:col-span-2 ${
            compacta ? 'col-span-5' : ''
          }`}
        >
          PUNTOS
        </span>
      </div>
      {filas.map((fila, i) => (
        <div
          key={`${fila.jugador_id}-${fila.posicion}`}
          className={i < filas.length - 1 ? 'border-b border-[#F4F4F4]' : ''}
        >
          <FilaContenido
            fila={fila}
            compacta={compacta}
            resaltarUserId={resaltarUserId}
          />
        </div>
      ))}
    </div>
  )
}
