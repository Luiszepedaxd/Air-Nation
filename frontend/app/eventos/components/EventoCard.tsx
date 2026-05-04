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
  descripcion: string | null
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
  cupo_vendido_creador: number | null
}

function getOcupacionData(evento: EventoCardRow): {
  ocupados: number
  porcentaje: number
  hayCupo: boolean
} {
  const cupo = evento.cupo ?? 0
  if (cupo <= 0) return { ocupados: 0, porcentaje: 0, hayCupo: false }
  const ocupados = evento.cupo_vendido_creador ?? evento.rsvp_count ?? 0
  const porcentaje = Math.min(100, Math.round((ocupados / cupo) * 100))
  return { ocupados, porcentaje, hayCupo: true }
}

function getCardBadge(
  evento: EventoCardRow,
  index: number
): { label: string; variant: 'agotado' | 'pocos' | 'proximo' } | null {
  const { porcentaje, hayCupo } = getOcupacionData(evento)
  if (hayCupo && porcentaje >= 100) return { label: 'AGOTADO', variant: 'agotado' }
  if (hayCupo && porcentaje >= 80) return { label: 'POCOS LUGARES', variant: 'pocos' }
  if (index === 0) return { label: 'PRÓXIMO', variant: 'proximo' }
  return null
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

function cupoLine(evento: EventoCardRow): string {
  const cupo = evento.cupo ?? 0
  if (cupo <= 0) return 'Sin límite'
  const { ocupados } = getOcupacionData(evento)
  return `${ocupados} / ${cupo} lugares`
}

export function EventoCard({
  evento,
  index = 0,
}: {
  evento: EventoCardRow
  index?: number
}) {
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

  const badge = getCardBadge(evento, index)
  const variantStyles = badge
    ? {
        agotado: 'bg-[#666666] text-white',
        pocos: 'bg-[#CC4B37] text-white',
        proximo: 'bg-white text-[#111111]',
      }[badge.variant]
    : ''

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
          <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
            {badge ? (
              <span
                className={`inline-block px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider ${variantStyles}`}
                style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
              >
                {badge.label}
              </span>
            ) : null}
            <span
              style={jost}
              className="bg-[#CC4B37] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
            >
              {disc}
            </span>
          </div>
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
          <div className="mt-auto">
            <p className="text-[12px] text-[#999999]" style={lato}>
              {cupoLine(evento)}
            </p>
            {(() => {
              const { porcentaje, hayCupo } = getOcupacionData(evento)
              if (!hayCupo) return null
              return (
                <div
                  className="mt-1.5 h-[3px] w-full overflow-hidden bg-[#EEEEEE]"
                  role="progressbar"
                  aria-valuenow={porcentaje}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full transition-all ${
                      porcentaje >= 100
                        ? 'bg-[#666666]'
                        : porcentaje >= 80
                          ? 'bg-[#CC4B37]'
                          : 'bg-[#CC4B37]/60'
                    }`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              )
            })()}
          </div>
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
