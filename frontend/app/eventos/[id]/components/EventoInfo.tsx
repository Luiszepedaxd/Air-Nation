import Link from 'next/link'
import {
  formatEventoFechaLarga,
  disciplinaLabel,
} from '../../lib/format-evento-fecha'
import { RSVPButton } from './RSVPButton'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function initialFrom(nombre: string | null, alias: string | null) {
  const s = alias?.trim()?.[0] || nombre?.trim()?.[0] || '?'
  return s.toUpperCase()
}

export function EventoInfo({
  eventId,
  descripcion,
  disciplina,
  fecha,
  field_nombre,
  field_slug,
  ciudad,
  cupo,
  rsvpCount,
  organizador_id,
  organizador_nombre,
  organizador_alias,
  organizador_avatar_url,
  sessionUserId,
  userHasRsvp,
}: {
  eventId: string
  descripcion: string | null
  disciplina: string | null
  fecha: string
  field_nombre: string | null
  field_slug: string | null
  ciudad: string | null
  cupo: number
  rsvpCount: number
  organizador_id: string | null
  organizador_nombre: string | null
  organizador_alias: string | null
  organizador_avatar_url: string | null
  sessionUserId: string | null
  userHasRsvp: boolean
}) {
  const fechaLarga = formatEventoFechaLarga(fecha)
  const disc = disciplinaLabel(disciplina)
  const pct =
    cupo > 0 ? Math.min(100, Math.round((rsvpCount / cupo) * 100)) : 0

  return (
    <div className="space-y-8 px-4 py-8 md:px-6">
      <section>
        <h2
          style={jost}
          className="text-[11px] font-extrabold uppercase tracking-widest text-[#999999]"
        >
          INFORMACIÓN
        </h2>
        <ul className="mt-4 space-y-3 text-[14px] text-[#111111]" style={lato}>
          <li>
            <span className="text-[#666666]">Disciplina: </span>
            <span className="font-semibold">{disc}</span>
          </li>
          <li>
            <span className="text-[#666666]">Fecha: </span>
            <span className="font-semibold">{fechaLarga || '—'}</span>
          </li>
          {field_nombre?.trim() && field_slug?.trim() ? (
            <li>
              <span className="text-[#666666]">Campo: </span>
              <Link
                href={`/campos/${encodeURIComponent(field_slug.trim())}`}
                className="font-semibold text-[#CC4B37] underline-offset-2 hover:underline"
              >
                {field_nombre.trim()}
              </Link>
              {ciudad?.trim() ? (
                <span className="text-[#666666]">
                  {' '}
                  · {ciudad.trim()}
                </span>
              ) : null}
            </li>
          ) : ciudad?.trim() ? (
            <li>
              <span className="text-[#666666]">Ciudad: </span>
              <span className="font-semibold">{ciudad.trim()}</span>
            </li>
          ) : null}
        </ul>
      </section>

      {descripcion?.trim() ? (
        <section>
          <h2
            style={jost}
            className="text-[11px] font-extrabold uppercase tracking-widest text-[#999999]"
          >
            DESCRIPCIÓN
          </h2>
          <p
            className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[#111111]"
            style={lato}
          >
            {descripcion.trim()}
          </p>
        </section>
      ) : null}

      <section>
        <h2
          style={jost}
          className="text-[11px] font-extrabold uppercase tracking-widest text-[#999999]"
        >
          CUPO
        </h2>
        {cupo <= 0 ? (
          <p className="mt-3 text-[14px] text-[#111111]" style={lato}>
            Sin límite de cupo · {rsvpCount} confirmados
          </p>
        ) : (
          <>
            <p className="mt-3 text-[14px] text-[#111111]" style={lato}>
              <span className="font-semibold">{rsvpCount}</span> confirmados /{' '}
              <span className="font-semibold">{cupo}</span> lugares
            </p>
            <div className="mt-2 h-2 w-full bg-[#EEEEEE]">
              <div
                className="h-full bg-[#CC4B37] transition-[width] duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}
      </section>

      {organizador_id ? (
        <section>
          <h2
            style={jost}
            className="text-[11px] font-extrabold uppercase tracking-widest text-[#999999]"
          >
            ORGANIZADOR
          </h2>
          <Link
            href={`/u/${organizador_id}`}
            className="mt-3 flex items-center gap-3"
          >
            <div className="h-8 w-8 shrink-0 overflow-hidden bg-[#F4F4F4]">
              {organizador_avatar_url?.trim() ? (
                <img
                  src={organizador_avatar_url.trim()}
                  alt=""
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[13px] text-[#CC4B37]"
                  style={{ ...jost, fontWeight: 700 }}
                >
                  {initialFrom(organizador_nombre, organizador_alias)}
                </div>
              )}
            </div>
            <div className="min-w-0" style={lato}>
              {organizador_nombre?.trim() ? (
                <p className="truncate text-[14px] font-semibold text-[#111111]">
                  {organizador_nombre.trim()}
                </p>
              ) : null}
              {organizador_alias?.trim() ? (
                <p className="truncate text-[13px] text-[#666666]">
                  @{organizador_alias.trim()}
                </p>
              ) : null}
            </div>
          </Link>
        </section>
      ) : null}

      {field_slug?.trim() ? (
        <Link
          href={`/campos/${encodeURIComponent(field_slug.trim())}`}
          style={jost}
          className="flex h-12 w-full items-center justify-center bg-[#111111] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
        >
          VER CAMPO
        </Link>
      ) : null}

      <RSVPButton
        eventId={eventId}
        cupo={cupo}
        initialCount={rsvpCount}
        initialHasRsvp={userHasRsvp}
        sessionUserId={sessionUserId}
      />
    </div>
  )
}
