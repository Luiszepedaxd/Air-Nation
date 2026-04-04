import Link from 'next/link'
import { PostPhotoGallery } from '@/app/equipos/[slug]/components/PostPhotoGallery'
import type { CampoDetailRow } from '../../types'
import { SolicitarCampoButton } from './SolicitarCampoButton'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" } as const

function normalizeTipo(raw: string | null | undefined): 'publico' | 'privado' {
  const t = (raw ?? '').toLowerCase().trim()
  if (t === 'privado' || t === 'private') return 'privado'
  return 'publico'
}

function instagramHref(raw: string): string {
  const t = raw.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  const handle = t.replace(/^@/, '')
  return `https://instagram.com/${handle}`
}

function HorariosBlock({ value }: { value: unknown }) {
  if (value == null) {
    return (
      <span className="text-sm text-[#111111]" style={lato}>
        Consultar
      </span>
    )
  }
  if (typeof value === 'string' && value.trim()) {
    return (
      <span className="text-sm text-[#111111]" style={lato}>
        {value.trim()}
      </span>
    )
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="text-sm text-[#111111]" style={lato}>
          Consultar
        </span>
      )
    }
    return (
      <ul className="list-none space-y-1 p-0 m-0">
        {value.map((row, i) => (
          <li
            key={i}
            className="text-sm text-[#111111]"
            style={lato}
          >
            {typeof row === 'object' && row !== null
              ? Object.entries(row as Record<string, unknown>)
                  .map(([k, v]) => `${k}: ${v == null ? '' : String(v)}`)
                  .join(' · ')
              : String(row)}
          </li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return (
        <span className="text-sm text-[#111111]" style={lato}>
          Consultar
        </span>
      )
    }
    return (
      <ul className="list-none space-y-1 p-0 m-0">
        {entries.map(([k, v]) => (
          <li
            key={k}
            className="text-sm text-[#111111]"
            style={lato}
          >
            <span className="font-semibold text-[#666666]">{k}:</span>{' '}
            {v !== null && typeof v === 'object'
              ? JSON.stringify(v)
              : v == null
                ? '—'
                : String(v)}
          </li>
        ))}
      </ul>
    )
  }
  return (
    <span className="text-sm text-[#111111]" style={lato}>
      Consultar
    </span>
  )
}

function PhoneIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 3h3l1.5 4-2 1.5c.8 1.5 2.2 2.9 3.7 3.7L15 11l4 1.5v3c0 .8-.6 1.5-1.4 1.6-5.6.6-11.2-4.9-11.8-10.5-.1-.8.6-1.6 1.4-1.6h.3Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IgIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5Z"
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function parseCoord(
  lat: number | string | null | undefined,
  lng: number | string | null | undefined
): { lat: number; lng: number } | null {
  const la = typeof lat === 'string' ? Number.parseFloat(lat) : lat
  const lo = typeof lng === 'string' ? Number.parseFloat(lng) : lng
  if (
    la == null ||
    lo == null ||
    !Number.isFinite(la) ||
    !Number.isFinite(lo)
  ) {
    return null
  }
  return { lat: la, lng: lo }
}

export function CampoInfo({
  field,
  fieldSlug,
  currentUserId,
  solicitanteNombre,
  solicitanteAlias,
}: {
  field: CampoDetailRow
  fieldSlug: string
  currentUserId: string | null
  solicitanteNombre: string | null
  solicitanteAlias: string | null
}) {
  const tipo = normalizeTipo(field.tipo)
  const team = field.teams
  const coords = parseCoord(field.ubicacion_lat, field.ubicacion_lng)
  const mapsUrl =
    coords != null
      ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : null

  const galeriaUrls = (field.galeria_urls ?? []).filter(
    (u) => typeof u === 'string' && u.trim().length > 0
  )

  return (
    <>
    <section className="border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-5 md:px-6">
      <h2
        className="border-b border-[#EEEEEE] pb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#111111]"
        style={jost}
      >
        Información
      </h2>
      <dl className="mt-4 space-y-4 m-0">
        <div>
          <dt
            className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            style={jost}
          >
            Disciplina
          </dt>
          <dd className="mt-1 m-0 text-sm text-[#111111]" style={lato}>
            Airsoft
          </dd>
        </div>
        <div>
          <dt
            className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            style={jost}
          >
            Horarios
          </dt>
          <dd className="mt-1 m-0">
            <HorariosBlock value={field.horarios} />
          </dd>
        </div>
        {field.telefono?.trim() ? (
          <div>
            <dt
              className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
              style={jost}
            >
              Teléfono
            </dt>
            <dd className="mt-1 m-0">
              <a
                href={`tel:${field.telefono.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 text-sm text-[#111111] underline-offset-2 hover:text-[#CC4B37] hover:underline"
                style={lato}
              >
                <span className="text-[#666666]">
                  <PhoneIcon />
                </span>
                {field.telefono.trim()}
              </a>
            </dd>
          </div>
        ) : null}
        {field.instagram?.trim() ? (
          <div>
            <dt
              className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
              style={jost}
            >
              Instagram
            </dt>
            <dd className="mt-1 m-0">
              <a
                href={instagramHref(field.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#111111] underline-offset-2 hover:text-[#CC4B37] hover:underline"
                style={lato}
              >
                <span className="text-[#666666]">
                  <IgIcon />
                </span>
                @{field.instagram.replace(/^@/, '').split('/').pop()}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      {team?.slug ? (
        <div className="mt-8 border border-[#EEEEEE] bg-[#FFFFFF] p-4">
          <h3
            className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
            style={jost}
          >
            Equipo organizador
          </h3>
          <Link
            href={`/equipos/${team.slug}`}
            className="mt-3 flex items-center gap-3 text-[#111111] transition-colors hover:text-[#CC4B37]"
          >
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 border border-[#EEEEEE] object-cover"
              />
            ) : (
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] text-sm font-extrabold text-[#666666]"
                style={jost}
              >
                {(team.nombre || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <span
              className="text-base font-extrabold uppercase leading-snug"
              style={jost}
            >
              {team.nombre}
            </span>
          </Link>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 border border-[#111111] bg-[#111111] px-4 py-4 text-center text-xs font-extrabold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90 md:w-auto md:min-w-[220px]"
            style={{ ...jost, borderRadius: 2 }}
          >
            <MapPinIcon />
            VER EN MAPA
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-4 text-center text-xs font-extrabold uppercase tracking-[0.14em] text-[#999999] md:w-auto md:min-w-[220px]"
            style={{ ...jost, borderRadius: 2 }}
          >
            UBICACIÓN NO DISPONIBLE
          </button>
        )}

        {tipo === 'publico' && currentUserId ? (
          <Link
            href={`/eventos/nuevo?field_id=${encodeURIComponent(field.id)}&field_nombre=${encodeURIComponent(field.nombre)}`}
            className="inline-flex w-full items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 text-center text-[11px] tracking-[0.12em] text-[#111111] md:w-auto md:min-w-[220px]"
            style={{ ...jostHeading, fontSize: 11, borderRadius: 0 }}
          >
            CREAR EVENTO AQUÍ
          </Link>
        ) : null}

        {tipo === 'privado' ? (
          <SolicitarCampoButton
            fieldId={field.id}
            fieldNombre={field.nombre}
            fieldSlug={fieldSlug}
            userId={currentUserId}
            solicitanteNombre={solicitanteNombre}
            solicitanteAlias={solicitanteAlias}
          />
        ) : null}
      </div>
    </section>

    {galeriaUrls.length > 0 ? (
      <section className="mt-6 border border-[#EEEEEE] bg-[#FFFFFF] px-4 py-5 md:px-6">
        <h2
          className="border-b border-[#EEEEEE] pb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#111111]"
          style={jostHeading}
        >
          Galería
        </h2>
        <div className="mt-4">
          <PostPhotoGallery urls={galeriaUrls} variant="campo" />
        </div>
      </section>
    ) : null}
    </>
  )
}
