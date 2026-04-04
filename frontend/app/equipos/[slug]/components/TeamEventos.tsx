import Link from 'next/link'
import { CalendarioPlaceholderIcon } from '@/app/eventos/lib/calendar-placeholder'
import {
  formatEventoFechaDiaMesHora,
  formatEventoFechaPasadaCompacta,
} from '@/app/eventos/lib/format-evento-fecha'
import type { TeamEventoPastRow, TeamEventoUpcomingRow } from '../types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

const jostSectionTitle = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

function PinIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#666666]"
      aria-hidden
    >
      <path
        d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5Z"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function tipoBadge(tipo: string | null) {
  const t = (tipo ?? '').toLowerCase()
  const pub = t !== 'privado'
  return pub ? 'PÚBLICO' : 'PRIVADO'
}

function cupoDisponiblesLine(cupo: number, rsvpCount: number): string {
  if (!cupo || cupo <= 0) return 'Sin límite'
  const left = Math.max(0, cupo - rsvpCount)
  return `${left} lugares disponibles`
}

export function TeamEventos({
  upcoming,
  past,
}: {
  upcoming: TeamEventoUpcomingRow[]
  past: TeamEventoPastRow[]
}) {
  if (!upcoming.length && !past.length) return null

  return (
    <>
      {upcoming.length > 0 ? (
        <section className="mx-auto w-full max-w-[960px] px-4 py-8">
          <h2
            style={jostSectionTitle}
            className="mb-6 text-[14px] font-extrabold uppercase tracking-wide text-[#111111] md:text-[16px]"
          >
            PRÓXIMOS EVENTOS
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((evento) => {
              const campo = evento.field_nombre?.trim() || null
              const fechaTxt = formatEventoFechaDiaMesHora(evento.fecha)
              const imagenFinal =
                evento.imagen_url?.trim() ||
                evento.field_foto?.trim() ||
                null
              return (
                <Link
                  key={evento.id}
                  href={`/eventos/${evento.id}`}
                  className="group flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-left transition-colors hover:border-[#CCCCCC]"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
                    {imagenFinal ? (
                      <img
                        src={imagenFinal}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#AAAAAA]">
                        <CalendarioPlaceholderIcon size={48} />
                      </div>
                    )}
                    <span
                      style={jost}
                      className="absolute left-2 top-2 bg-[#111111]/85 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
                    >
                      {tipoBadge(evento.tipo)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <h3
                      style={jost}
                      className="line-clamp-2 text-[14px] font-bold leading-snug text-[#111111]"
                    >
                      {evento.title}
                    </h3>
                    {campo ? (
                      <p
                        className="flex items-center gap-1.5 text-[12px] text-[#666666]"
                        style={lato}
                      >
                        <PinIcon />
                        <span className="min-w-0 truncate">{campo}</span>
                      </p>
                    ) : null}
                    <p className="text-[13px] text-[#666666]" style={lato}>
                      {fechaTxt}
                    </p>
                    <p className="mt-auto text-[12px] text-[#999999]" style={lato}>
                      {cupoDisponiblesLine(evento.cupo, evento.rsvp_count)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="mx-auto w-full max-w-[960px] px-4 py-8">
          <h2
            style={jostSectionTitle}
            className="mb-6 text-[14px] font-extrabold uppercase tracking-wide text-[#111111] md:text-[16px]"
          >
            EVENTOS PASADOS
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {past.map((evento) => {
              const imagenFinal =
                evento.imagen_url?.trim() ||
                evento.field_foto?.trim() ||
                null
              return (
              <Link
                key={evento.id}
                href={`/eventos/${evento.id}`}
                className="flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-left transition-colors hover:border-[#CCCCCC]"
              >
                <div className="aspect-square w-full overflow-hidden bg-[#111111]">
                  {imagenFinal ? (
                    <img
                      src={imagenFinal}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#AAAAAA]">
                      <CalendarioPlaceholderIcon size={36} />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p
                    style={jost}
                    className="line-clamp-2 text-[12px] font-bold leading-snug text-[#111111]"
                  >
                    {evento.title}
                  </p>
                  <p
                    className="mt-1 text-[11px] text-[#666666]"
                    style={lato}
                  >
                    {formatEventoFechaPasadaCompacta(evento.fecha)}
                  </p>
                </div>
              </Link>
              )
            })}
          </div>
        </section>
      ) : null}
    </>
  )
}
