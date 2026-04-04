import Link from 'next/link'
import { formatEventoFechaCorta } from '@/app/eventos/lib/format-evento-fecha'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export type MisEventoRsvpItem = {
  id: string
  title: string
  fecha: string
  imagen_url: string | null
}

export function MisEventosRsvpSection({
  items,
  hasMore,
}: {
  items: MisEventoRsvpItem[]
  hasMore: boolean
}) {
  if (items.length === 0) return null

  return (
    <section className="mt-8 border-t border-solid border-[#EEEEEE] pt-8">
      <h2
        style={jost}
        className="text-[11px] font-extrabold uppercase tracking-widest text-[#999999]"
      >
        MIS EVENTOS
      </h2>
      <ul className="mt-4 space-y-3">
        {items.map((e) => {
          const fechaCorta = formatEventoFechaCorta(e.fecha)
          return (
            <li key={e.id}>
              <Link
                href={`/eventos/${e.id}`}
                className="flex items-center gap-3 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-2 transition-colors hover:border-[#DDDDDD]"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden bg-[#F4F4F4]">
                  {e.imagen_url?.trim() ? (
                    <img
                      src={e.imagen_url.trim()}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-[10px] text-[#AAAAAA]"
                      style={jost}
                    >
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1" style={lato}>
                  <p className="truncate text-[13px] font-semibold text-[#111111]">
                    {e.title}
                  </p>
                  {fechaCorta ? (
                    <p className="mt-0.5 truncate text-[12px] text-[#666666]">
                      {fechaCorta}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
      {hasMore ? (
        <Link
          href="/eventos"
          className="mt-4 inline-block text-[12px] font-semibold text-[#CC4B37] underline-offset-2 hover:underline"
          style={lato}
        >
          Ver todos mis eventos →
        </Link>
      ) : null}
    </section>
  )
}
