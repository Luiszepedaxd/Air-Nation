import Link from 'next/link'
import type { RankingFila } from '@/lib/ranking'
import { hrefJugador } from '@/lib/ranking'

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function TarjetaPodio({
  fila,
  lugar,
  alto,
}: {
  fila: RankingFila
  lugar: 1 | 2 | 3
  alto: 'alto' | 'medio' | 'bajo'
}) {
  const perfilHref = hrefJugador(fila.user_id)
  const esPrimero = lugar === 1
  const paddingTop =
    alto === 'alto' ? 'pt-10 md:pt-14' : alto === 'medio' ? 'pt-6 md:pt-8' : 'pt-4 md:pt-6'

  const inner = (
    <article
      className={`flex flex-col items-center border border-[#EEEEEE] bg-white px-4 pb-6 text-center ${paddingTop} ${
        esPrimero
          ? 'border-t-4 border-t-[#CC4B37] shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
          : 'border-t border-t-[#EEEEEE]'
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold ${
          esPrimero ? 'bg-[#CC4B37] text-white' : 'bg-[#111111] text-white'
        }`}
        style={{ fontFamily: "'Jost', sans-serif" }}
      >
        {iniciales(fila.nombre_publico)}
      </div>
      <p
        className="mt-4 font-display text-4xl font-black tabular-nums text-[#CC4B37]"
        style={{ lineHeight: 1 }}
      >
        {lugar}
      </p>
      <p className="mt-2 font-body text-[14px] font-bold text-[#111111]">{fila.nombre_publico}</p>
      {fila.ciudad ? (
        <p className="mt-1 font-body text-[12px] text-[#999999]">{fila.ciudad}</p>
      ) : null}
      <p className="mt-3 font-display text-2xl font-black tabular-nums text-[#CC4B37]">
        {fila.puntos}
      </p>
    </article>
  )

  if (perfilHref) {
    return (
      <Link href={perfilHref} className="block transition-opacity hover:opacity-90">
        {inner}
      </Link>
    )
  }
  return inner
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
    <div className="mb-8">
      <div className="flex flex-col gap-4 md:hidden">
        <TarjetaPodio fila={p1} lugar={1} alto="alto" />
        <TarjetaPodio fila={p2} lugar={2} alto="medio" />
        <TarjetaPodio fila={p3} lugar={3} alto="bajo" />
      </div>
      <div className="hidden items-end gap-4 md:grid md:grid-cols-3">
        <TarjetaPodio fila={p2} lugar={2} alto="medio" />
        <TarjetaPodio fila={p1} lugar={1} alto="alto" />
        <TarjetaPodio fila={p3} lugar={3} alto="bajo" />
      </div>
    </div>
  )
}
