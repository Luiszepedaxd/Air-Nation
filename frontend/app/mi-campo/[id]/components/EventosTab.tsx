import Link from 'next/link'
import { CalendarioPlaceholderIcon } from '@/app/eventos/lib/calendar-placeholder'
import { formatEventoFechaCorta } from '@/app/eventos/lib/format-evento-fecha'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export type MiCampoEventRow = {
  id: string
  title: string
  fecha: string
  cupo: number
  tipo: string | null
  status: string
  published: boolean
  imagen_url: string | null
  rsvp_count: number
}

function tipoBadge(tipo: string | null) {
  const t = (tipo ?? '').toLowerCase()
  return t === 'privado' ? 'PRIVADO' : 'PÚBLICO'
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'publicado') return 'bg-[#111111] text-[#FFFFFF]'
  if (s === 'cancelado') return 'bg-[#CC4B37] text-[#FFFFFF]'
  return 'bg-[#F4F4F4] text-[#666666]'
}

function statusLabel(status: string) {
  const s = status.toLowerCase()
  if (s === 'publicado') return 'PUBLICADO'
  if (s === 'cancelado') return 'CANCELADO'
  if (s === 'borrador') return 'BORRADOR'
  return status.toUpperCase()
}

export function EventosTab({
  fieldId,
  events,
  canCreateEvento,
}: {
  fieldId: string
  events: MiCampoEventRow[]
  canCreateEvento: boolean
}) {
  return (
    <div className="pb-10">
      {canCreateEvento ? (
        <Link
          href={`/admin/eventos/nuevo?field_id=${encodeURIComponent(fieldId)}`}
          style={jost}
          className="mb-6 flex h-12 w-full items-center justify-center bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
        >
          CREAR EVENTO
        </Link>
      ) : null}

      {events.length === 0 ? (
        <p className="text-[14px] text-[#666666]" style={lato}>
          No hay eventos para este campo
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
            >
              <div className="flex gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#111111]">
                  {ev.imagen_url?.trim() ? (
                    <img
                      src={ev.imagen_url.trim()}
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#AAAAAA]">
                      <CalendarioPlaceholderIcon size={22} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[15px] font-semibold text-[#111111]"
                    style={lato}
                  >
                    {ev.title}
                  </p>
                  <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                    {formatEventoFechaCorta(ev.fecha) || '—'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      style={jost}
                      className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-[#EEEEEE] text-[#666666]"
                    >
                      {tipoBadge(ev.tipo)}
                    </span>
                    <span
                      style={jost}
                      className={`inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${statusBadgeClass(ev.status)}`}
                    >
                      {statusLabel(ev.status)}
                    </span>
                    {!ev.published ? (
                      <span
                        style={jost}
                        className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-[#FFF3CD] text-[#856404]"
                      >
                        NO PUBLICADO
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[12px] text-[#999999]" style={lato}>
                    RSVPs: {ev.rsvp_count}
                    {ev.cupo > 0 ? ` / ${ev.cupo} cupo` : ''}
                  </p>
                  <div className="mt-3">
                    <Link
                      href={`/eventos/${ev.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={jost}
                      className="inline-flex min-h-[36px] items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 text-[10px] font-extrabold uppercase tracking-wide text-[#111111]"
                    >
                      VER
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
