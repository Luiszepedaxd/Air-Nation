import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import PublicSiteHeader from '@/components/layout/PublicSiteHeader'
import { formatEventoFechaCorta } from '../lib/format-evento-fecha'
import { EventoHero } from './components/EventoHero'
import { EventoTabs } from './components/EventoTabs'

export const revalidate = 0

function normalizeFieldsEmbed(raw: unknown): {
  nombre: string | null
  slug: string | null
  ciudad: string | null
  foto_portada_url: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') {
    return { nombre: null, slug: null, ciudad: null, foto_portada_url: null }
  }
  const x = o as Record<string, unknown>
  return {
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    slug: typeof x.slug === 'string' ? x.slug : null,
    ciudad: typeof x.ciudad === 'string' ? x.ciudad : null,
    foto_portada_url:
      typeof x.foto_portada_url === 'string' ? x.foto_portada_url : null,
  }
}

function normalizeOrganizador(raw: unknown): {
  id: string | null
  nombre: string | null
  alias: string | null
  avatar_url: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') {
    return { id: null, nombre: null, alias: null, avatar_url: null }
  }
  const x = o as Record<string, unknown>
  return {
    id: typeof x.id === 'string' ? x.id : null,
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    alias: typeof x.alias === 'string' ? x.alias : null,
    avatar_url: typeof x.avatar_url === 'string' ? x.avatar_url : null,
  }
}

type EventDetailRow = {
  id: string
  title: string
  descripcion: string | null
  field_id: string | null
  fecha: string
  cupo: number
  disciplina: string | null
  imagen_url: string | null
  tipo: string | null
  published: boolean
  organizador_id: string | null
  fields: unknown
  organizador: unknown
}

const getEventoById = cache(async (id: string): Promise<EventDetailRow | null> => {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      descripcion,
      field_id,
      fecha,
      cupo,
      disciplina,
      imagen_url,
      tipo,
      published,
      organizador_id,
      fields ( nombre, slug, ciudad, foto_portada_url ),
      organizador:users!organizador_id ( id, nombre, alias, avatar_url )
    `
    )
    .eq('id', id)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    console.error('[eventos/id]', error.message, error.details, error.hint)
    return null
  }
  if (!data) return null
  return data as unknown as EventDetailRow
})

async function fetchRsvpCount(eventId: string): Promise<number> {
  const supabase = createPublicSupabaseClient()
  const { count, error } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
  if (error) {
    console.error('[eventos/id] rsvp count', error.message)
    return 0
  }
  return count ?? 0
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const id = params.id?.trim()
  if (!id) return { title: 'Evento — AirNation' }

  const row = await getEventoById(id)
  if (!row) return { title: 'Evento — AirNation' }

  const fMeta = normalizeFieldsEmbed(row.fields)
  const imagenOg =
    row.imagen_url?.trim() || fMeta.foto_portada_url?.trim() || null

  const fechaTxt = formatEventoFechaCorta(row.fecha)
  const desc =
    row.descripcion?.trim() ||
    `Evento de airsoft${fechaTxt ? ` el ${fechaTxt}` : ''} — AirNation`

  return {
    title: `${row.title} — Airsoft en ${fMeta.ciudad ?? 'México'} | AirNation`,
    description: desc.slice(0, 160),
    alternates: {
      canonical: `https://www.airnation.online/eventos/${id}`,
    },
    openGraph: {
      title: `${row.title} — Airsoft en ${fMeta.ciudad ?? 'México'} | AirNation`,
      description: desc.slice(0, 160),
      url: `https://www.airnation.online/eventos/${id}`,
      type: 'website',
      images: imagenOg
        ? [{ url: imagenOg, width: 1200, height: 630 }]
        : [{ url: 'https://www.airnation.online/og-default.jpg', width: 1200, height: 630 }],
    },
  }
}

type EventFeedPostRow = {
  kind: 'player' | 'team'
  id: string
  content: string | null
  fotos_urls: string[] | null
  video_url: string | null
  video_mp4_url: string | null
  video_duration_s: number | null
  mentions: string[] | null
  mentionAliasById: Record<string, string> | null
  created_at: string
  author_id: string
  author_nombre: string | null
  author_alias: string | null
  author_slug: string | null
  author_avatar_url: string | null
}

async function fetchEventoPosts(eventId: string): Promise<EventFeedPostRow[]> {
  const supabase = createPublicSupabaseClient()

  const [playerRes, teamRes] = await Promise.all([
    supabase
      .from('player_posts')
      .select(
        `id, user_id, content, fotos_urls, video_url, video_mp4_url, video_duration_s, mentions, created_at,
         users!player_posts_user_id_fkey ( id, nombre, alias, avatar_url )`
      )
      .eq('event_id', eventId)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('team_posts')
      .select(
        `id, team_id, content, fotos_urls, video_url, video_mp4_url, video_duration_s, mentions, created_at,
         teams!team_posts_team_id_fkey ( id, nombre, slug, logo_url )`
      )
      .eq('event_id', eventId)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const mentionIds = new Set<string>()
  const collect = (rows: unknown[] | null | undefined) => {
    for (const r of rows ?? []) {
      const m = (r as { mentions?: unknown }).mentions
      if (Array.isArray(m)) for (const uid of m) mentionIds.add(String(uid))
    }
  }
  collect(playerRes.data)
  collect(teamRes.data)

  const aliasById = new Map<string, string>()
  if (mentionIds.size > 0) {
    const { data: mu } = await supabase
      .from('users')
      .select('id, alias')
      .in('id', Array.from(mentionIds))
    for (const u of mu ?? []) {
      const r = u as { id: string; alias: string | null }
      if (r.alias?.trim()) aliasById.set(r.id, r.alias.trim())
    }
  }

  const buildMentionMap = (mentions: unknown): Record<string, string> | null => {
    if (!Array.isArray(mentions) || mentions.length === 0) return null
    const o: Record<string, string> = {}
    for (const uid of mentions) {
      const sid = String(uid)
      const al = aliasById.get(sid)
      if (al) o[sid] = al
    }
    return Object.keys(o).length > 0 ? o : null
  }

  const playerRows: EventFeedPostRow[] = (playerRes.data ?? []).map((raw) => {
    const r = raw as Record<string, unknown>
    const u = Array.isArray(r.users) ? r.users[0] : r.users
    const uo = (u ?? {}) as Record<string, unknown>
    const mentions = Array.isArray(r.mentions) ? (r.mentions as unknown[]).map(String) : null
    return {
      kind: 'player',
      id: String(r.id),
      content: (r.content as string | null) ?? null,
      fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : null,
      video_url: (r.video_url as string | null) ?? null,
      video_mp4_url: (r.video_mp4_url as string | null) ?? null,
      video_duration_s:
        r.video_duration_s != null && Number.isFinite(Number(r.video_duration_s))
          ? Number(r.video_duration_s)
          : null,
      mentions,
      mentionAliasById: buildMentionMap(r.mentions),
      created_at: String(r.created_at ?? ''),
      author_id: String(r.user_id ?? ''),
      author_nombre: (uo.nombre as string | null) ?? null,
      author_alias: (uo.alias as string | null) ?? null,
      author_slug: null,
      author_avatar_url: (uo.avatar_url as string | null) ?? null,
    }
  })

  const teamRows: EventFeedPostRow[] = (teamRes.data ?? []).map((raw) => {
    const r = raw as Record<string, unknown>
    const t = Array.isArray(r.teams) ? r.teams[0] : r.teams
    const to = (t ?? {}) as Record<string, unknown>
    const mentions = Array.isArray(r.mentions) ? (r.mentions as unknown[]).map(String) : null
    return {
      kind: 'team',
      id: String(r.id),
      content: (r.content as string | null) ?? null,
      fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : null,
      video_url: (r.video_url as string | null) ?? null,
      video_mp4_url: (r.video_mp4_url as string | null) ?? null,
      video_duration_s:
        r.video_duration_s != null && Number.isFinite(Number(r.video_duration_s))
          ? Number(r.video_duration_s)
          : null,
      mentions,
      mentionAliasById: buildMentionMap(r.mentions),
      created_at: String(r.created_at ?? ''),
      author_id: String(r.team_id ?? ''),
      author_nombre: (to.nombre as string | null) ?? null,
      author_alias: null,
      author_slug: (to.slug as string | null) ?? null,
      author_avatar_url: (to.logo_url as string | null) ?? null,
    }
  })

  const merged = [...playerRows, ...teamRows].sort((a, b) => {
    const ta = new Date(a.created_at).getTime()
    const tb = new Date(b.created_at).getTime()
    return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta)
  })

  return merged
}

export type { EventFeedPostRow }

export default async function EventoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id?.trim()
  if (!id) notFound()

  const row = await getEventoById(id)
  if (!row) notFound()

  const f = normalizeFieldsEmbed(row.fields)
  const heroImagen =
    row.imagen_url?.trim() || f.foto_portada_url?.trim() || null
  const org = normalizeOrganizador(row.organizador)
  const rsvpCount = await fetchRsvpCount(id)

  const dash = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await dash.auth.getUser()

  let userHasRsvp = false
  if (user) {
    const { data: rsvpRow } = await dash
      .from('event_rsvps')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    userHasRsvp = !!rsvpRow
  }

  const orgId = org.id ?? row.organizador_id

  const eventoPosts = await fetchEventoPosts(id)

  let canPublish = false
  if (user) {
    if (userHasRsvp) {
      canPublish = true
    } else {
      const fechaMs = new Date(row.fecha).getTime()
      if (Number.isFinite(fechaMs)) {
        const now = Date.now()
        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000
        if (Math.abs(fechaMs - now) <= THREE_DAYS) {
          canPublish = true
        }
      }
    }
  }

  let currentUserAlias: string | null = null
  let currentUserAvatar: string | null = null
  if (user) {
    const { data: me } = await dash
      .from('users')
      .select('alias, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    currentUserAlias = (me?.alias as string | null) ?? null
    currentUserAvatar = (me?.avatar_url as string | null) ?? null
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: row.title,
            startDate: row.fecha,
            description: row.descripcion ?? undefined,
            url: `https://www.airnation.online/eventos/${id}`,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            ...(heroImagen ? { image: heroImagen } : {}),
            location: f.nombre
              ? {
                  '@type': 'Place',
                  name: f.nombre,
                  ...(f.slug
                    ? { url: `https://www.airnation.online/campos/${f.slug}` }
                    : {}),
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: f.ciudad ?? '',
                    addressCountry: 'MX',
                  },
                }
              : {
                  '@type': 'Place',
                  address: {
                    '@type': 'PostalAddress',
                    addressCountry: 'MX',
                  },
                },
            organizer: {
              '@type': 'Organization',
              name: 'AirNation',
              url: 'https://www.airnation.online',
            },
          }),
        }}
      />
      <EventoHero
        title={row.title}
        fecha={row.fecha}
        imagen_url={heroImagen}
        tipo={row.tipo}
        disciplina={row.disciplina}
      />
      <EventoTabs
        eventId={id}
        descripcion={row.descripcion}
        disciplina={row.disciplina}
        fecha={row.fecha}
        field_nombre={f.nombre}
        field_slug={f.slug}
        ciudad={f.ciudad}
        cupo={Number(row.cupo ?? 0)}
        rsvpCount={rsvpCount}
        organizador_id={orgId}
        organizador_nombre={org.nombre}
        organizador_alias={org.alias}
        organizador_avatar_url={org.avatar_url}
        sessionUserId={user?.id ?? null}
        userHasRsvp={userHasRsvp}
        initialPosts={eventoPosts}
        currentUserAlias={currentUserAlias}
        currentUserAvatar={currentUserAvatar}
        canPublish={canPublish}
      />
    </div>
  )
}
