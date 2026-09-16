import Link from 'next/link'
import { Trophy } from 'lucide-react'
import type { RankingFila } from '@/lib/ranking'
import { hrefJugador } from '@/lib/ranking'

const PEDESTAL_TEXTURE =
  'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 10px)'

const jostNombre = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 700,
} as const

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function ColumnaPodio({
  fila,
  lugar,
}: {
  fila: RankingFila
  lugar: 1 | 2 | 3
}) {
  const perfilHref = hrefJugador(fila.user_id)
  const esPrimero = lugar === 1
  const altoPedestal = esPrimero
    ? 'h-28 sm:h-44'
    : lugar === 2
      ? 'h-20 sm:h-32'
      : 'h-14 sm:h-24'

  const inner = (
    <article className="flex min-w-0 flex-col items-center">
      {esPrimero ? (
        <Trophy
          className="mb-2 h-5 w-5 text-[#CC4B37] sm:h-7 sm:w-7"
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
      <div
        className={`flex items-center justify-center rounded-full font-display font-black text-white transition-transform duration-200 ${
          perfilHref ? 'group-hover:scale-105' : ''
        } ${
          esPrimero
            ? 'h-14 w-14 bg-[#CC4B37] ring-4 ring-[#CC4B37]/20 sm:h-20 sm:w-20'
            : 'h-11 w-11 bg-[#111111] ring-2 ring-[#111111]/10 sm:h-16 sm:w-16'
        }`}
      >
        {iniciales(fila.nombre_publico)}
      </div>
      <p
        className="mt-2 line-clamp-2 text-center text-[11px] text-[#111111] sm:text-sm"
        style={jostNombre}
      >
        {fila.nombre_publico}
      </p>
      {fila.ciudad ? (
        <p className="mt-0.5 hidden text-xs text-[#999999] sm:block">{fila.ciudad}</p>
      ) : null}
      <p
        className={`mt-1 font-display font-black tabular-nums text-[#CC4B37] ${
          esPrimero ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'
        }`}
      >
        {fila.puntos}
      </p>
      <p className="mb-3 text-[10px] tracking-[0.2em] text-[#999999]">PTS</p>
      <div
        className={`w-full rounded-t-[2px] ${altoPedestal} ${
          esPrimero ? 'bg-[#CC4B37]' : 'bg-[#111111]'
        }`}
        style={{
          backgroundImage: PEDESTAL_TEXTURE,
          borderTop: esPrimero
            ? '3px solid rgba(255,255,255,0.35)'
            : '3px solid #CC4B37',
        }}
      >
        <p
          className={`pt-3 text-center font-display font-black text-white sm:pt-4 ${
            esPrimero ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl'
          }`}
        >
          {lugar}
        </p>
      </div>
    </article>
  )

  if (perfilHref) {
    return (
      <Link href={perfilHref} className="group min-w-0">
        {inner}
      </Link>
    )
  }
  return <div className="min-w-0">{inner}</div>
}

type Props = {
  filas: RankingFila[]
}

export function PodioRanking({ filas }: Props) {
  const top3 = filas.filter((f) => f.posicion >= 1 && f.posicion <= 3)
  const p1 = top3.find((f) => f.posicion === 1)
  const p2 = top3.find((f) => f.posicion === 2)
  const p3 = top3.find((f) => f.posicion === 3)

  if (!p1 || !p2 || !p3) return null

  return (
    <div className="mx-auto mb-10 max-w-3xl sm:mb-14">
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
        <ColumnaPodio fila={p2} lugar={2} />
        <ColumnaPodio fila={p1} lugar={1} />
        <ColumnaPodio fila={p3} lugar={3} />
      </div>
      <div className="h-2 bg-[#111111]" aria-hidden />
    </div>
  )
}
