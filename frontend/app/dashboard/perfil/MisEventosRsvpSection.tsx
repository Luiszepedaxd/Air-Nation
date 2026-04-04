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
  /** `fields.foto_portada_url` para fallback de portada */
  field_foto: string | null
  field_nombre: string | null
  field_slug: string | null
  organizador_id: string | null
}

function EventoCard({
  e,
  currentUserId,
  showEdit,
}: {
  e: MisEventoRsvpItem
  currentUserId: string
  showEdit: boolean
}) {
  const fechaCorta = formatEventoFechaCorta(e.fecha)
  const fn = e.field_nombre?.trim()
  const fs = e.field_slug?.trim()
  const eventoHref = `/eventos/${e.id}`
  const imagenFinal =
    e.imagen_url?.trim() || e.field_foto?.trim() || null
  const canEdit =
    showEdit && e.organizador_id != null && e.organizador_id === currentUserId

  return (
    <li className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-3 transition-colors hover:border-[#DDDDDD]">
      <div className="flex gap-3">
        <Link
          href={eventoHref}
          className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]"
        >
          {imagenFinal ? (
            <img
              src={imagenFinal}
              alt=""
              width={48}
              height={48}
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
        </Link>
        <div className="min-w-0 flex-1" style={lato}>
          <Link href={eventoHref} className="block">
            <p
              className="text-[14px] font-semibold leading-snug text-[#111111] hover:text-[#CC4B37]"
              style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
            >
              {e.title}
            </p>
          </Link>
          {fechaCorta ? (
            <p className="mt-1 text-[12px] text-[#666666]">{fechaCorta}</p>
          ) : null}
          {fn && fs ? (
            <p className="mt-1 text-[12px] text-[#666666]">
              <span className="text-[#999999]">Campo: </span>
              <Link
                href={`/campos/${encodeURIComponent(fs)}`}
                className="font-semibold text-[#CC4B37] underline-offset-2 hover:underline"
              >
                {fn}
              </Link>
            </p>
          ) : fn ? (
            <p className="mt-1 text-[12px] text-[#666666]">
              <span className="text-[#999999]">Campo: </span>
              {fn}
            </p>
          ) : null}
        </div>
        {canEdit ? (
          <Link
            href={`/eventos/${e.id}/editar`}
            style={jost}
            className="flex h-9 shrink-0 items-center self-start border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#111111]"
          >
            EDITAR
          </Link>
        ) : null}
      </div>
    </li>
  )
}

export function MisEventosRsvpSection({
  proximos,
  pasados,
  currentUserId,
}: {
  proximos: MisEventoRsvpItem[]
  pasados: MisEventoRsvpItem[]
  currentUserId: string
}) {
  const hasAny = proximos.length > 0 || pasados.length > 0

  if (!hasAny) {
    return (
      <div className="flex flex-col items-center gap-6 px-2 py-12 text-center">
        <p className="text-[13px] text-[#666666]" style={lato}>
          No tienes eventos con confirmación (RSVP)
        </p>
        <Link
          href="/eventos"
          style={jost}
          className="inline-flex min-h-[44px] min-w-[200px] items-center justify-center bg-[#CC4B37] px-6 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
        >
          EXPLORAR EVENTOS
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {proximos.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {proximos.map((e) => (
            <EventoCard
              key={e.id}
              e={e}
              currentUserId={currentUserId}
              showEdit
            />
          ))}
        </ul>
      ) : null}

      {pasados.length > 0 ? (
        <div>
          <h2
            style={jost}
            className={`mb-4 text-[11px] font-extrabold uppercase tracking-widest text-[#999999] ${
              proximos.length > 0
                ? 'border-t border-solid border-[#EEEEEE] pt-8'
                : ''
            }`}
          >
            PASADOS
          </h2>
          <ul className="flex flex-col gap-4">
            {pasados.map((e) => (
              <EventoCard
                key={e.id}
                e={e}
                currentUserId={currentUserId}
                showEdit={false}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
