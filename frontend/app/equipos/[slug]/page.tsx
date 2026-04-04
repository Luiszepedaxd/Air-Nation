import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { TeamHero } from './components/TeamHero'
import { TeamInfo } from './components/TeamInfo'
import { TeamStats } from './components/TeamStats'
import { JoinButton } from './components/JoinButton'
import { TeamPosts } from './components/TeamPosts'
import { TeamAlbums } from './components/TeamAlbums'
import { TeamMembers } from './components/TeamMembers'
import type {
  AlbumWithPhotos,
  MemberDisplay,
  PublicTeam,
  TeamPostRow,
} from './types'

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
    .select('id, user_id, rol_plataforma, rango_militar')
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
    }
  })

  merged.sort((a, b) => {
    const an = (a.alias || a.nombre || '').toLowerCase()
    const bn = (b.alias || b.nombre || '').toLowerCase()
    return an.localeCompare(bn, 'es')
  })

  return merged
}

async function fetchPosts(teamId: string): Promise<TeamPostRow[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('team_posts')
    .select('id, title, content, foto_url, created_at')
    .eq('team_id', teamId)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(6)

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

  const [members, posts, albums] = await Promise.all([
    fetchMembers(team.id),
    fetchPosts(team.id),
    fetchAlbumsWithPhotos(team.id),
  ])

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <TeamHero team={team} members={members} />
      <TeamStats memberCount={members.length} createdAt={team.created_at} />
      <TeamInfo team={team} />
      <div className="mx-auto max-w-[960px] px-4 py-4">
        <JoinButton teamId={team.id} slug={params.slug} members={members} />
      </div>
      <TeamPosts posts={posts} />
      <TeamAlbums albums={albums} />
      <TeamMembers members={members} />
    </div>
  )
}
