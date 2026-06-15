'use client'

import Link from 'next/link'
import { PatrocinadoBadge } from '@/components/eventos/PatrocinadoBadge'
import { esEventoPatrocinado, resolveEventHref } from '@/lib/evento-links'

export type EventoHomeRow = {
  id: string
  title: string
  fecha: string
  cupo: number
  imagen_url: string | null
  url_externa: string | null
  field_foto: string | null
  field_nombre: string | null
  ciudad: string | null
  sede_nombre: string | null
  sede_ciudad: string | null
  cupo_vendido_creador: number | null
  rsvp_count: number
}

function formatFecha(iso: string) {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
      .format(d)
      .toUpperCase()
  } catch {
    return ''
  }
}

function diasRestantes(iso: string): number {
  try {
    const d = new Date(iso)
    const now = new Date()
    const ms = d.getTime() - now.getTime()
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  } catch {
    return 0
  }
}

function getOcupacion(evento: EventoHomeRow): {
  porcentaje: number
  hayCupo: boolean
} {
  const cupo = evento.cupo ?? 0
  if (cupo <= 0) return { porcentaje: 0, hayCupo: false }
  const ocupados = evento.cupo_vendido_creador ?? evento.rsvp_count ?? 0
  const porcentaje = Math.min(100, Math.round((ocupados / cupo) * 100))
  return { porcentaje, hayCupo: true }
}

function getBadge(
  evento: EventoHomeRow,
  index: number
): {
  label: string
  variant: 'agotado' | 'pocos' | 'proximo'
} | null {
  const { porcentaje, hayCupo } = getOcupacion(evento)
  if (hayCupo && porcentaje >= 100)
    return { label: 'AGOTADO', variant: 'agotado' }
  if (hayCupo && porcentaje >= 80)
    return { label: 'POCOS LUGARES', variant: 'pocos' }
  if (index === 0) return { label: 'PRÓXIMO', variant: 'proximo' }
  return null
}

export function EventoHomeCard({
  evento,
  index,
}: {
  evento: EventoHomeRow
  index: number
}) {
  const imageUrl =
    evento.imagen_url ?? evento.field_foto ?? '/og-default.jpg'
  const sede = evento.field_nombre ?? evento.sede_nombre ?? null
  const ciudad = evento.ciudad ?? evento.sede_ciudad ?? null
  const dias = diasRestantes(evento.fecha)
  const badge = getBadge(evento, index)

  const variantStyles = badge
    ? {
        agotado: 'bg-[#666666] text-white',
        pocos: 'bg-[#CC4B37] text-white',
        proximo: 'bg-white text-[#111111]',
      }[badge.variant]
    : ''

  return (
    <Link href={resolveEventHref(evento.url_externa, evento.id)} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden border border-solid border-[#EEEEEE] bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#CC4B37] group-hover:shadow-[0_25px_50px_-15px_rgba(204,75,55,0.3)]">
        <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[#111111] sm:h-auto sm:aspect-video">
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          {badge ? (
            <span
              className={`absolute right-3 top-3 z-10 inline-block px-2.5 py-1 font-body text-[10px] font-extrabold uppercase tracking-wider ${variantStyles}`}
              style={{ borderRadius: 2 }}
            >
              {badge.label}
            </span>
          ) : null}
          {dias > 0 ? (
            <span
              className="absolute left-3 top-3 z-10 inline-block bg-black/70 px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
              style={{ borderRadius: 2 }}
            >
              {dias === 1 ? 'Mañana' : `Faltan ${dias} días`}
            </span>
          ) : null}
          {esEventoPatrocinado(evento.url_externa) ? (
            <div className="absolute bottom-2 left-2 z-20">
              <PatrocinadoBadge />
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37]">
            {formatFecha(evento.fecha)}
          </p>
          <h3
            className="mt-1.5 line-clamp-2 font-display font-extrabold uppercase leading-[1.1] text-[#111111] transition-colors group-hover:text-[#CC4B37]"
            style={{ fontSize: 'clamp(1.05rem, 1.6vw, 1.35rem)' }}
          >
            {evento.title}
          </h3>

          {sede || ciudad ? (
            <p className="mt-2 flex items-center gap-1.5 font-body text-[12px] text-[#666666]">
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden
                className="shrink-0"
              >
                <path
                  d="M6 11s4-3.5 4-7a4 4 0 0 0-8 0c0 3.5 4 7 4 7z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <circle
                  cx="6"
                  cy="4"
                  r="1.4"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
              <span className="truncate">
                {sede}
                {sede && ciudad ? ' · ' : ''}
                {ciudad}
              </span>
            </p>
          ) : null}

          <span className="mt-auto inline-flex items-center gap-1.5 border-t border-solid border-[#EEEEEE] pt-3 font-body text-[10px] font-bold uppercase tracking-[0.18em] text-[#CC4B37]">
            Ver evento
            <svg
              width="11"
              height="11"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="transition-transform group-hover:translate-x-1"
            >
              <path
                d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  )
}
