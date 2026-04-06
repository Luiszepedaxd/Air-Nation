import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { TeamHero } from './components/TeamHero'
import { TeamStats } from './components/TeamStats'
import { TeamPublicTabs } from './components/TeamPublicTabs'
import type {
  AlbumWithPhotos,
  MemberDisplay,
  PublicTeam,
  TeamEventoPastRow,
  TeamEventoUpcomingRow,
  TeamPostRow,
} from './types'

function memberRoleRank(rol: string | null): number {
  const r = (rol ?? '').toLowerCase().trim()
  if (r === 'founder' || r === 'fundador') return 0
  if (r === 'admin') return 1
  return 2
}

function sortMembersByRoleAndDate(members: MemberDisplay[]): MemberDisplay[] {
  return [...members].sort((a, b) => {
    const ra = memberRoleRank(a.rol_plataforma)
    const rb = memberRoleRank(b.rol_plataforma)
    if (ra !== rb) return ra - rb
    const ta = new Date(a.created_at).getTime()
    const tb = new Date(b.created_at).getTime()
    const taN = Number.isNaN(ta) ? 0 : ta
    const tbN = Number.isNaN(tb) ? 0 : tb
    return taN - tbN
  })
}

export const revalidate = 0

const getTeamBySlug = cache(async (slug: string): Promise<PublicTeam | null> => {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('teams')
    .select(
      'id, nombre, slug, ciudad, descripcion, historia, foto_portada_url, logo_url, galeria_urls, instagram, facebook, whatsapp_url, created_at, status'
    )
    .eq('slug', slug)
    .eq('status', 'activo')
    .maybeSingle()

  if (error || !data) return null
  const row = data as PublicTeam & {
    status?: string
    galeria_urls?: string[] | null
  }
  if (row.status && row.status !== 'activo') return null

  const rawGaleria = row.galeria_urls
  const galeria_urls = Array.isArray(rawGaleria)
    ? rawGaleria
    : rawGaleria != null
      ? [String(rawGaleria)]
      : null

  return {
    id: row.id,
    nombre: row.nombre,
    slug: row.slug,
    ciudad: row.ciudad,
    descripcion: row.descripcion ?? null,
    historia: row.historia ?? null,
    foto_portada_url: row.foto_portada_url,
    logo_url: row.logo_url,
    galeria_urls,
    instagram: row.instagram,
    facebook: row.facebook,
    whatsapp_url: row.whatsapp_url,
    created_at: row.created_at,
  }
})

async function fetchMembers(teamId: string): Promise<MemberDisplay[]> {
  const supabase = createPublicSupabaseClient()
  const { data: rows, error } = await supabase
    .from('team_members')
    .select('id, user_id, rol_plataforma, rango_militar, created_at')
    .eq('team_id', teamId)
    .eq('status', 'activo')

  if (error || !rows?.length) return []

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)))
  const { data: users } = await supabase
    .from('users')
    .select('id, nombre, alias, avatar_url')
    .in('id', userIds)

  const userMap = new Map(
    (users ?? []).map((u) => [
      u.id as string,
      u as { nombre: string | null; alias: string | null; avatar_url: string | null },
    ])
  )

  const merged: MemberDisplay[] = rows.map((r) => {
    const u = userMap.get(r.user_id)
    return {
      id: r.id as string,
      user_id: r.user_id as string,
      rol_plataforma: (r.rol_plataforma as string | null) ?? null,
      rango_militar: (r.rango_militar as string | null) ?? null,
      nombre: u?.nombre ?? null,
      alias: u?.alias ?? null,
      avatar_url: u?.avatar_url ?? null,
      created_at: String((r as { created_at?: string }).created_at ?? ''),
    }
  })

  return sortMembersByRoleAndDate(merged)
}

async function fetchPosts(teamId: string): Promise<TeamPostRow[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('team_posts')
    .select('id, content, fotos_urls, created_at')
    .eq('team_id', teamId)
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as TeamPostRow[]
}

async function fetchAlbumsWithPhotos(teamId: string): Promise<AlbumWithPhotos[]> {
  const supabase = createPublicSupabaseClient()
  const { data: albums, error: aErr } = await supabase
    .from('team_albums')
    .select('id, nombre, created_at, fotos_urls')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (aErr || !albums?.length) return []

  return albums.map((a) => {
    const row = a as {
      id: string
      nombre: string | null
      created_at: string
      fotos_urls?: string[] | null
    }
    const raw = row.fotos_urls
    const fotos_urls = (Array.isArray(raw) ? raw : [])
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter(Boolean)

    return {
      id: row.id,
      nombre: row.nombre ?? '',
      created_at: row.created_at,
      fotos_urls,
    }
  })
}

function normalizeEventFieldsEmbed(raw: unknown): {
  nombre: string | null
  slug: string | null
  foto_portada_url: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') {
    return { nombre: null, slug: null, foto_portada_url: null }
  }
  const x = o as Record<string, unknown>
  return {
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    slug: typeof x.slug === 'string' ? x.slug : null,
    foto_portada_url:
      typeof x.foto_portada_url === 'string' ? x.foto_portada_url : null,
  }
}

function teamEventsOrFilter(fieldIds: string[], organizerIds: string[]): string | null {
  const parts: string[] = []
  if (fieldIds.length) parts.push(`field_id.in.(${fieldIds.join(',')})`)
  if (organizerIds.length) parts.push(`organizador_id.in.(${organizerIds.join(',')})`)
  return parts.length ? parts.join(',') : null
}

async function fetchTeamEventScope(teamId: string): Promise<{
  fieldIds: string[]
  organizerIds: string[]
}> {
  const supabase = createPublicSupabaseClient()
  const [{ data: fieldRows }, { data: memberRows }] = await Promise.all([
    supabase.from('fields').select('id').eq('team_id', teamId),
    supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('status', 'activo'),
  ])
  const fieldIds = (fieldRows ?? [])
    .map((r) => r.id as string)
    .filter(Boolean)
  const organizerIds = Array.from(
    new Set(
      (memberRows ?? []).map((m) => m.user_id as string).filter(Boolean)
    )
  )
  return { fieldIds, organizerIds }
}

async function fetchTeamUpcomingEvents(
  fieldIds: string[],
  organizerIds: string[]
): Promise<TeamEventoUpcomingRow[]> {
  const orF = teamEventsOrFilter(fieldIds, organizerIds)
  if (!orF) return []

  const supabase = createPublicSupabaseClient()
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      fecha,
      imagen_url,
      cupo,
      tipo,
      fields ( nombre, slug, foto_portada_url )
    `
    )
    .eq('published', true)
    .eq('status', 'publicado')
    .gte('fecha', nowIso)
    .or(orF)
    .order('fecha', { ascending: true })
    .limit(6)

  if (error) {
    console.error('[equipos/slug] upcoming events:', error.message)
    return []
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  const ids = rows.map((r) => String(r.id)).filter(Boolean)
  const countMap = new Map<string, number>()
  if (ids.length > 0) {
    const { data: batch, error: batchErr } = await supabase.rpc(
      'event_rsvp_counts_batch',
      { p_event_ids: ids }
    )
    if (!batchErr && Array.isArray(batch)) {
      for (const row of batch as { event_id: string; total: number }[]) {
        if (row?.event_id != null) countMap.set(String(row.event_id), row.total)
      }
    }
  }

  return rows.map((r) => {
    const f = normalizeEventFieldsEmbed(r.fields)
    const id = String(r.id)
    return {
      id,
      title: String(r.title ?? ''),
      fecha: String(r.fecha ?? ''),
      cupo: Number(r.cupo ?? 0),
      imagen_url: (r.imagen_url as string | null) ?? null,
      field_foto: f.foto_portada_url,
      tipo: (r.tipo as string | null) ?? null,
      field_nombre: f.nombre,
      field_slug: f.slug,
      rsvp_count: countMap.get(id) ?? 0,
    }
  })
}

async function fetchTeamPastEvents(
  fieldIds: string[],
  organizerIds: string[]
): Promise<TeamEventoPastRow[]> {
  const orF = teamEventsOrFilter(fieldIds, organizerIds)
  if (!orF) return []

  const supabase = createPublicSupabaseClient()
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, title, fecha, imagen_url, cupo, fields ( nombre, slug, foto_portada_url )'
    )
    .eq('published', true)
    .eq('status', 'publicado')
    .lt('fecha', nowIso)
    .or(orF)
    .order('fecha', { ascending: false })
    .limit(12)

  if (error) {
    console.error('[equipos/slug] past events:', error.message)
    return []
  }

  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>
    const rawFields = row.fields
    const fo = Array.isArray(rawFields) ? rawFields[0] : rawFields
    const fieldFoto =
      fo && typeof fo === 'object' && 'foto_portada_url' in fo
        ? String((fo as { foto_portada_url?: string }).foto_portada_url ?? '')
        : ''
    const fieldNombre =
      fo && typeof fo === 'object' && 'nombre' in fo
        ? String((fo as { nombre?: string }).nombre ?? '').trim() || null
        : null
    const fieldSlug =
      fo && typeof fo === 'object' && 'slug' in fo
        ? String((fo as { slug?: string }).slug ?? '').trim() || null
        : null
    return {
      id: String(row.id ?? ''),
      title: String(row.title ?? ''),
      fecha: String(row.fecha ?? ''),
      imagen_url: (row.imagen_url as string | null) ?? null,
      field_foto: fieldFoto.trim() || null,
      field_nombre: fieldNombre,
      field_slug: fieldSlug,
      cupo: Number(row.cupo ?? 0),
    }
  })
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const team = await getTeamBySlug(params.slug)
  if (!team) {
    return { title: 'AirNation' }
  }

  const desc =
    team.descripcion?.trim() ||
    `Equipo de airsoft en ${team.ciudad || 'México'} — AirNation`

  return {
    title: `${team.nombre} — AirNation`,
    description: desc,
    openGraph: {
      title: `${team.nombre} — AirNation`,
      description: desc,
      images: team.foto_portada_url ? [{ url: team.foto_portada_url }] : [],
    },
  }
}

export default async function EquipoPublicPage({
  params,
}: {
  params: { slug: string }
}) {
  const team = await getTeamBySlug(params.slug)
  if (!team) notFound()

  const scope = await fetchTeamEventScope(team.id)
  const [members, posts, albums, upcomingEvents, pastEvents] = await Promise.all([
    fetchMembers(team.id),
    fetchPosts(team.id),
    fetchAlbumsWithPhotos(team.id),
    fetchTeamUpcomingEvents(scope.fieldIds, scope.organizerIds),
    fetchTeamPastEvents(scope.fieldIds, scope.organizerIds),
  ])

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <TeamHero team={team} members={members} />
      <TeamStats memberCount={members.length} createdAt={team.created_at} />
      <TeamPublicTabs
        team={team}
        slug={params.slug}
        members={members}
        posts={posts}
        albums={albums}
        upcoming={upcomingEvents}
        past={pastEvents}
      />
    </div>
  )
}
