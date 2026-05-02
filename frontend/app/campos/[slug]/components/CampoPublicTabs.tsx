'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PostPhotoGallery } from '@/app/equipos/[slug]/components/PostPhotoGallery'
import { PhotoGrid } from '@/components/posts/PhotoGrid'
import { PostActions } from '@/components/posts/PostInteractions'
import { ReportablePostMenu } from '@/components/posts/ReportablePostMenu'
import { formatEventoFechaCorta } from '@/app/eventos/lib/format-evento-fecha'
import {
  FIELD_DAY_KEYS,
  FIELD_DAY_LABELS,
  weekScheduleFromJson,
} from '@/lib/field-schedule'
import { supabase } from '@/lib/supabase'
import type { CampoDetailRow, FieldReviewPublic } from '../../types'
import { CampoReviews } from './CampoReviews'
import { SolicitarCampoButton } from './SolicitarCampoButton'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const CAMPO_TAB_IDS = [
  'info',
  'publicaciones',
  'eventos',
  'galeria',
  'resenas',
] as const
type CampoTabId = (typeof CAMPO_TAB_IDS)[number]

function campoTabFromSearchParams(
  sp: URLSearchParams | { get: (key: string) => string | null }
): CampoTabId {
  const raw = sp.get('tab')
  if (raw && (CAMPO_TAB_IDS as readonly string[]).includes(raw)) {
    return raw as CampoTabId
  }
  return 'info'
}

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

function StarsSmall({ value }: { value: number }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={14} height={14} viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.77L10 2.5z"
            fill={i <= value ? '#CC4B37' : 'none'}
            stroke={i <= value ? '#CC4B37' : '#CCCCCC'}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}

function PinMapIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#666666]"
      aria-hidden
    >
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

export type CampoEventoListItem = {
  id: string
  title: string
  fecha: string
  cupo: number
  imagen_url: string | null
}

export type CampoFieldPostPublic = {
  id: string
  content: string
  fotos_urls: string[]
  created_at: string
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / (1000 * 60 * 60))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch {
    return ''
  }
}

export function CampoPublicTabs({
  field,
  fieldSlug,
  currentUserId,
  solicitanteNombre,
  solicitanteAlias,
  initialReviews,
  eventos,
}: {
  field: CampoDetailRow
  fieldSlug: string
  currentUserId: string | null
  solicitanteNombre: string | null
  solicitanteAlias: string | null
  initialReviews: FieldReviewPublic[]
  eventos: CampoEventoListItem[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tab, setTabState] = useState<CampoTabId>(() =>
    campoTabFromSearchParams(new URLSearchParams(searchParams.toString()))
  )

  useEffect(() => {
    setTabState(campoTabFromSearchParams(new URLSearchParams(searchParams.toString())))
  }, [searchParams])

  function setTab(id: CampoTabId) {
    setTabState(id)
    const next = new URLSearchParams(searchParams.toString())
    next.set('tab', id)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }
  const [publicaciones, setPublicaciones] = useState<CampoFieldPostPublic[]>([])
  const [publicacionesLoading, setPublicacionesLoading] = useState(true)

  const tipo = normalizeTipo(field.tipo)
  const team = field.teams
  const mapsUrl = field.maps_url?.trim() ?? ''
  const direccion = field.direccion?.trim() ?? ''
  const schedule = weekScheduleFromJson(field.horarios_json)

  const galeriaUrls = (field.galeria_urls ?? []).filter(
    (u) => typeof u === 'string' && u.trim().length > 0
  )

  const showUbicacionBlock = Boolean(direccion || mapsUrl)
  const showTelefono = Boolean(field.telefono?.trim())
  const showContactSeparator = showUbicacionBlock || showTelefono

  const reviewCount = initialReviews.length
  const promedioNum = Number(field.promedio_rating)
  const promedioSafe = Number.isFinite(promedioNum) ? promedioNum : 0
  const showRatingSummary =
    reviewCount > 0 || promedioSafe > 0

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setPublicacionesLoading(true)
      const { data, error } = await supabase
        .from('field_posts')
        .select('id, content, fotos_urls, created_at')
        .eq('field_id', field.id)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (error) {
        console.error('[CampoPublicTabs] field_posts:', error.message)
        setPublicaciones([])
      } else {
        const rows = (data ?? []) as Record<string, unknown>[]
        setPublicaciones(
          rows.map((r) => {
            const raw = r.fotos_urls
            const urls = Array.isArray(raw)
              ? raw.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
              : []
            return {
              id: String(r.id ?? ''),
              content: String(r.content ?? ''),
              fotos_urls: urls,
              created_at: String(r.created_at ?? ''),
            }
          })
        )
      }
      setPublicacionesLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [field.id])

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-[#EEEEEE] bg-[#FFFFFF]">
        {showRatingSummary ? (
          <button
            type="button"
            onClick={() => {
              setTab('resenas')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="group flex w-full cursor-pointer items-center gap-2 border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 text-left transition-colors md:px-6"
          >
            <StarsSmall value={Math.round(promedioSafe)} />
            <span
              className="text-2xl font-extrabold text-[#111111] transition-colors group-hover:text-[#CC4B37]"
              style={jost}
            >
              {promedioSafe.toFixed(1)}
            </span>
            <span
              className="text-sm text-[#666666] transition-colors group-hover:text-[#CC4B37]"
              style={lato}
            >
              {reviewCount}{' '}
              {reviewCount === 1 ? 'reseña' : 'reseñas'}
            </span>
          </button>
        ) : null}
        <div className="overflow-x-auto">
          <nav
            className="flex min-w-max gap-6 px-4 md:mx-auto md:max-w-[960px] md:gap-8 md:px-6"
            aria-label="Secciones del campo"
          >
            {(
              [
                ['info', 'Info'],
                ['publicaciones', 'Publicaciones'],
                ['eventos', 'Eventos'],
                ['galeria', 'Galería'],
                ['resenas', 'Reseñas'],
              ] as const
            ).map(([id, label]) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`shrink-0 border-b-2 py-3 font-body text-[0.75rem] uppercase tracking-[0.15em] transition-colors ${
                    active
                      ? 'border-[#CC4B37] font-bold text-[#111111]'
                      : 'border-transparent font-normal text-[#444444] hover:text-[#111111]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-4 py-6 md:px-6 md:py-8">
        {tab === 'info' ? (
          <div className="space-y-8">
            {showUbicacionBlock ? (
              <section className="space-y-4">
                {direccion ? (
                  <p
                    className="flex items-start gap-3 text-sm text-[#111111]"
                    style={lato}
                  >
                    <PinMapIcon />
                    <span>{direccion}</span>
                  </p>
                ) : null}
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center bg-[#111111] px-4 py-4 text-center text-xs font-extrabold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
                    style={{ ...jost, borderRadius: 2 }}
                  >
                    VER EN GOOGLE MAPS →
                  </a>
                ) : null}
              </section>
            ) : null}

            {showTelefono && field.telefono ? (
              <section>
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
              </section>
            ) : null}

            {showContactSeparator ? (
              <div className="border-t border-[#EEEEEE] my-6" aria-hidden />
            ) : null}

            <section>
              <h2
                className="mb-3 text-[11px] tracking-[0.14em] text-[#111111]"
                style={jostHeading}
              >
                HORARIOS
              </h2>
              <div className="overflow-x-auto border border-[#EEEEEE]">
                <table className="w-full min-w-[280px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#EEEEEE] bg-[#F4F4F4]">
                      <th
                        className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
                        style={jostHeading}
                      >
                        Día
                      </th>
                      <th
                        className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
                        style={jostHeading}
                      >
                        Estado
                      </th>
                      <th
                        className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
                        style={jostHeading}
                      >
                        Horas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FIELD_DAY_KEYS.map((day) => {
                      const row = schedule[day]
                      const open = row.abierto
                      return (
                        <tr
                          key={day}
                          className="border-b border-[#EEEEEE] last:border-b-0"
                        >
                          <td
                            className="px-3 py-2.5 font-bold text-[#111111]"
                            style={lato}
                          >
                            {FIELD_DAY_LABELS[day]}
                          </td>
                          <td
                            className={`px-3 py-2.5 ${open ? 'text-[#111111]' : 'text-dim'}`}
                            style={lato}
                          >
                            {open ? 'ABIERTO' : 'CERRADO'}
                          </td>
                          <td
                            className={`px-3 py-2.5 ${open ? 'text-[#111111]' : 'text-dim'}`}
                            style={lato}
                          >
                            {open
                              ? `${row.apertura} – ${row.cierre}`
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {field.descripcion?.trim() ? (
              <section>
                <h2
                  className="mb-3 text-[11px] tracking-[0.14em] text-[#111111]"
                  style={jostHeading}
                >
                  DESCRIPCIÓN
                </h2>
                <p
                  className="whitespace-pre-wrap text-sm leading-relaxed text-[#111111]"
                  style={lato}
                >
                  {field.descripcion.trim()}
                </p>
              </section>
            ) : null}

            {field.instagram?.trim() ? (
              <section>
                <h2
                  className="mb-2 text-[11px] tracking-[0.14em] text-[#999999]"
                  style={jostHeading}
                >
                  INSTAGRAM
                </h2>
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
              </section>
            ) : null}

            {team?.slug ? (
              <section className="border border-[#EEEEEE] bg-[#F4F4F4] p-4">
                <h3
                  className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jostHeading}
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#EEEEEE] bg-[#FFFFFF] text-sm font-extrabold text-[#666666]"
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
              </section>
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
        ) : null}

        {tab === 'publicaciones' ? (
          <div>
            {publicacionesLoading ? (
              <p className="text-sm text-[#AAAAAA]" style={lato}>
                Cargando…
              </p>
            ) : publicaciones.length === 0 ? (
              <p className="text-sm text-[#AAAAAA]" style={lato}>
                No hay publicaciones aún
              </p>
            ) : (
              <ul className="m-0 list-none p-0">
                {publicaciones.map((p, idx) => {
                  const photos = p.fotos_urls.slice(0, 4)
                  const isLast = idx === publicaciones.length - 1
                  const isFieldOwner =
                    currentUserId != null &&
                    currentUserId === field.created_by
                  return (
                    <li
                      key={p.id}
                      className={`pb-6 ${isLast ? '' : 'mb-6 border-b border-[#EEEEEE]'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] text-[#999999]" style={lato}>
                          {formatRelative(p.created_at)}
                        </p>
                        <ReportablePostMenu
                          canDelete={isFieldOwner}
                          onDelete={async () => {
                            const { error } = await supabase
                              .from('field_posts')
                              .delete()
                              .eq('id', p.id)
                              .eq('field_id', field.id)
                            if (!error) {
                              setPublicaciones((prev) =>
                                prev.filter((x) => x.id !== p.id)
                              )
                            }
                          }}
                          reporterId={
                            currentUserId && !isFieldOwner ? currentUserId : null
                          }
                          targetType="post"
                          targetId={p.id}
                          targetLabel={
                            p.content?.trim().slice(0, 80) ||
                            `Publicación en ${field.nombre}`
                          }
                        />
                      </div>
                      {p.content?.trim() ? (
                        <p
                          className="mb-3 text-[14px] text-[#111111] leading-relaxed whitespace-pre-wrap"
                          style={lato}
                        >
                          {p.content.trim()}
                        </p>
                      ) : null}
                      {photos.length > 0 && <PhotoGrid urls={photos} />}
                      <PostActions
                        postType="field"
                        postId={p.id}
                        postOwnerId={field.created_by ?? null}
                        postHref={`/campos/${field.slug}`}
                        currentUserId={currentUserId}
                        currentUserAlias={null}
                        currentUserAvatar={null}
                        shareUrl={`/campos/${field.slug}`}
                        shareTitle={`${field.nombre} en AirNation`}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}

        {tab === 'galeria' ? (
          <div>
            {galeriaUrls.length > 0 ? (
              <PostPhotoGallery urls={galeriaUrls} variant="campo" />
            ) : (
              <p className="text-sm text-dim" style={lato}>
                Sin fotos disponibles
              </p>
            )}
          </div>
        ) : null}

        {tab === 'eventos' ? (
          <div className="space-y-4">
            {eventos.length === 0 ? (
              <p className="text-sm text-dim" style={lato}>
                No hay eventos próximos
              </p>
            ) : (
              <ul className="m-0 list-none space-y-4 p-0">
                {eventos.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/eventos/${ev.id}`}
                      className="flex gap-3 border border-[#EEEEEE] bg-[#F4F4F4] p-3 transition-colors hover:border-[#CCCCCC]"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-[#111111]">
                        {ev.imagen_url ? (
                          <img
                            src={ev.imagen_url}
                            alt=""
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-extrabold uppercase text-white/80" style={jost}>
                            Evento
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="line-clamp-2 text-sm font-extrabold uppercase leading-snug text-[#111111]"
                          style={jost}
                        >
                          {ev.title}
                        </p>
                        <p className="mt-1 text-xs text-[#666666]" style={lato}>
                          {formatEventoFechaCorta(ev.fecha)}
                        </p>
                        <p className="mt-1 text-xs text-[#666666]" style={lato}>
                          Cupo: {ev.cupo}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {tipo === 'publico' && currentUserId ? (
              <Link
                href={`/eventos/nuevo?field_id=${encodeURIComponent(field.id)}&field_nombre=${encodeURIComponent(field.nombre)}`}
                className="mt-4 flex w-full items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 text-center text-[11px] tracking-[0.12em] text-[#111111]"
                style={{ ...jostHeading, fontSize: 11, borderRadius: 0 }}
              >
                CREAR EVENTO AQUÍ
              </Link>
            ) : null}
          </div>
        ) : null}

        {tab === 'resenas' ? (
          <CampoReviews
            fieldId={field.id}
            slug={fieldSlug}
            initialReviews={initialReviews}
            variant="tab"
          />
        ) : null}
      </div>
    </div>
  )
}
