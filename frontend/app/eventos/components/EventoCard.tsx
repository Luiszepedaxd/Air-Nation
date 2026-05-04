import Link from 'next/link'
import { formatEventoFechaCorta, disciplinaLabel } from '../lib/format-evento-fecha'
import { CalendarioPlaceholderIcon } from '../lib/calendar-placeholder'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

export type EventoCardRow = {
  id: string
  title: string
  fecha: string
  cupo: number
  disciplina: string | null
  imagen_url: string | null
  /** `fields.foto_portada_url` */
  field_foto: string | null
  tipo: string | null
  field_nombre: string | null
  field_slug: string | null
  ciudad: string | null
  /** Conteo de RSVPs (listado público). */
  rsvp_count?: number
  sede_nombre: string | null
  sede_ciudad: string | null
}

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

function cupoLine(cupo: number, rsvpCount: number | undefined) {
  if (!cupo || cupo <= 0) return 'Sin límite'
  const x = rsvpCount ?? 0
  return `${x} / ${cupo} lugares`
}

export function EventoCard({ evento }: { evento: EventoCardRow }) {
  const fechaTxt = formatEventoFechaCorta(evento.fecha)
  const disc = disciplinaLabel(evento.disciplina)
  const imagenFinal =
    evento.imagen_url?.trim() || evento.field_foto?.trim() || null
  const fieldNombre = evento.field_nombre?.trim() || null
  const sedeLibre = evento.sede_nombre?.trim() || null
  const sedeFinal = fieldNombre || sedeLibre || null
  const ciudadFinal =
    evento.ciudad?.trim() || evento.sede_ciudad?.trim() || null
  const slug = evento.field_slug?.trim() || null
  const campoLinkSlug =
    slug && fieldNombre && sedeFinal === fieldNombre ? slug : null

  return (
    <div className="group flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF] transition-colors hover:border-[#CCCCCC]">
      <Link
        href={`/eventos/${evento.id}`}
        className="flex flex-1 flex-col text-left"
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
          <span
            style={jost}
            className="absolute right-2 top-2 bg-[#CC4B37] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
          >
            {disc}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <h2
            style={jost}
            className="line-clamp-2 text-base font-extrabold leading-snug text-[#111111]"
          >
            {evento.title}
          </h2>
          <p className="text-[13px] text-[#666666]" style={lato}>
            {fechaTxt}
          </p>
          <p className="mt-auto text-[12px] text-[#999999]" style={lato}>
            {cupoLine(evento.cupo, evento.rsvp_count)}
          </p>
        </div>
      </Link>
      {sedeFinal || ciudadFinal ? (
        <div className="flex items-center gap-1 border-t border-solid border-[#EEEEEE] px-3 pb-3 pt-2 text-[11px] text-[#666666]">
          <PinIcon />
          <span className="min-w-0 truncate">
            {campoLinkSlug ? (
              <Link
                href={`/campos/${encodeURIComponent(campoLinkSlug)}`}
                className="hover:text-[#CC4B37]"
              >
                {sedeFinal}
              </Link>
            ) : (
              sedeFinal
            )}
            {sedeFinal && ciudadFinal ? ' · ' : ''}
            {ciudadFinal}
          </span>
        </div>
      ) : null}
    </div>
  )
}
