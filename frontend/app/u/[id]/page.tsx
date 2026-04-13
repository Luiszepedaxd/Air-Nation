import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { createPublicSupabaseClient } from '../supabase-public'
import { PlayerProfileClient } from './PlayerProfileClient'
import { PlayerHero } from './PlayerHero'
import type { PlayerEventRow, PlayerPostRow, PublicReplicaRow, PublicUserProfile } from './types'

export const revalidate = 0

export type { PlayerEventRow, PlayerPostRow, PublicReplicaRow, PublicUserProfile }

const ROL_LABELS: Record<string, string> = {
  rifleman: 'Jugador',
  sniper: 'Francotirador',
  support: 'Support',
  medic: 'Medic',
  team_leader: 'Líder de equipo',
  scout: 'Scout',
  rookie: 'Rookie',
}

function rolLabel(rol: string | null) {
  if (!rol) return ''
  return ROL_LABELS[rol] || rol
}

function mapTeamRole(rol: string | null | undefined): string | null {
  if (rol == null || rol === '') return null
  const r = String(rol).toLowerCase()
  if (r === 'founder') return 'Fundador'
  if (r === 'admin') return 'Admin'
  if (r === 'member') return 'Miembro'
  return null
}

async function fetchPublicProfile(id: string) {
  const supabase = createPublicSupabaseClient()

  const { data: row, error } = await supabase
    .from('users')
    .select(
      'id, alias, nombre, ciudad, rol, avatar_url, foto_portada_url, bio, instagram, tiktok, youtube, facebook, member_number, created_at, perfil_publico, team_id'
    )
    .eq('id', id)
    .maybeSingle()

  if (error) console.error('[u/profile] users query error:', error)
  if (!row || !row.id) return null

  let teamData: {
    id: string
    nombre: string
    slug: string
    logo_url: string | null
  } | null = null
  if (row.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('id, nombre, slug, logo_url')
      .eq('id', row.team_id)
      .maybeSingle()
    if (team)
      teamData = team as {
        id: string
        nombre: string
        slug: string
        logo_url: string | null
      }
  }

  let teams_list: PublicUserProfile['teams_list'] = undefined
  const { data: memberRows } = await supabase
    .from('team_members')
    .select('rol_plataforma, teams(id, nombre, slug, logo_url)')
    .eq('user_id', row.id)
    .eq('status', 'activo')

  if (memberRows && memberRows.length > 0) {
    const seen = new Set<string>()
    const list: NonNullable<PublicUserProfile['teams_list']> = []
    for (const mr of memberRows as {
      rol_plataforma: string | null
      teams:
        | { id: string; nombre: string; slug: string; logo_url: string | null }
        | { id: string; nombre: string; slug: string; logo_url: string | null }[]
        | null
    }[]) {
      const raw = mr.teams
      const team = Array.isArray(raw) ? raw[0] : raw
      if (!team?.id || seen.has(team.id)) continue
      seen.add(team.id)
      list.push({
        id: team.id,
        nombre: team.nombre,
        slug: team.slug,
        logo_url: team.logo_url,
        team_role: mr.rol_plataforma ?? null,
      })
    }
    if (list.length > 0) teams_list = list
  }

  if (!teams_list?.length && teamData) {
    teams_list = [{ ...teamData, team_role: null }]
  }

  const user: PublicUserProfile = {
    ...(row as unknown as Omit<PublicUserProfile, 'teams' | 'teams_list'>),
    teams: teamData,
    teams_list,
  }

  let posts: PlayerPostRow[] = []
  const { data: postsData } = await supabase
    .from('player_posts')
    .select('id, content, fotos_urls, created_at')
    .eq('user_id', id)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (postsData) posts = postsData as PlayerPostRow[]

  let events: PlayerEventRow[] = []
  try {
    const { data: rsvpData } = await supabase
      .from('event_rsvps')
      .select('events(id, title, fecha, imagen_url, status)')
      .eq('user_id', id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(6)

    if (rsvpData) {
      events = (rsvpData as unknown as { events: PlayerEventRow | PlayerEventRow[] | null }[])
        .map((r) => {
          const e = r.events
          if (!e) return null
          return Array.isArray(e) ? e[0] : e
        })
        .filter((e): e is PlayerEventRow => e !== null)
    }
  } catch {
    // event_rsvps table may not exist yet
  }

  let replicas: PublicReplicaRow[] = []
  const { data: replicasData } = await supabase
    .from('arsenal')
    .select('id, nombre, sistema, mecanismo, condicion, foto_url, verificada, ciudad, estado')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  if (replicasData) replicas = replicasData as PublicReplicaRow[]

  return { user, posts, events, replicas }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const result = await fetchPublicProfile(params.id)
  if (!result) {
    return { title: 'AirNation' }
  }
  const { user } = result
  const descParts = [`Perfil de ${user.alias} en AirNation`]
  if (user.ciudad) descParts.push(user.ciudad)
  if (user.rol) descParts.push(rolLabel(user.rol))

  const ogImage = user.avatar_url?.trim()
    ? user.avatar_url
    : 'https://www.airnation.online/og-default.jpg'

  return {
    title: `${user.alias} — AirNation`,
    description: descParts.join('. '),
    openGraph: {
      title: `${user.alias} — AirNation`,
      description: descParts.join('. '),
      url: `https://www.airnation.online/u/${user.id}`,
      siteName: 'AirNation',
      images: [{ url: ogImage, width: 400, height: 400, alt: user.alias ?? 'AirNation' }],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${user.alias} — AirNation`,
      description: descParts.join('. '),
      images: [ogImage],
    },
  }
}

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export default async function PublicProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const result = await fetchPublicProfile(params.id)
  if (!result) notFound()

  const { user, posts, events, replicas } = result

  const supabaseServer = createDashboardSupabaseServerClient()
  const {
    data: { user: currentUser },
  } = await supabaseServer.auth.getUser()

  if (user.perfil_publico === false) {
    return (
      <main className="flex min-h-screen min-w-[375px] items-center justify-center bg-[#FFFFFF] px-8 py-8 text-[#111111]">
        <div className="text-center">
          <h1
            style={jost}
            className="text-[24px] font-extrabold uppercase leading-tight text-[#111111]"
          >
            {user.alias}
          </h1>
          <p className="mt-4 text-[14px] text-[#666666]" style={lato}>
            Este perfil es privado
          </p>
        </div>
      </main>
    )
  }

  const subtitle =
    [user.ciudad, user.rol ? rolLabel(user.rol) : null].filter(Boolean).join(' · ') ||
    '—'

  const supabasePublic = createPublicSupabaseClient()
  const [
    { count: followersCount },
    { count: followingCount },
    followRow,
    teamMemberRes,
  ] = await Promise.all([
    supabasePublic
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id),
    supabasePublic
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id),
    currentUser
      ? supabasePublic
          .from('user_follows')
          .select('follower_id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user.team_id
      ? supabasePublic
          .from('team_members')
          .select('rol_plataforma')
          .eq('user_id', user.id)
          .eq('team_id', user.team_id)
          .eq('status', 'activo')
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const teamRole = mapTeamRole(
    teamMemberRes.data?.rol_plataforma as string | undefined
  )

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PlayerHero
        user={user}
        subtitle={subtitle}
        followersCount={followersCount ?? 0}
        followingCount={followingCount ?? 0}
        isFollowing={!!followRow?.data}
        currentUserId={currentUser?.id ?? null}
        teamRole={teamRole}
      />

      <PlayerProfileClient
        user={user}
        posts={posts}
        events={events}
        replicas={replicas}
        rolLabels={ROL_LABELS}
        currentUserId={currentUser?.id ?? null}
        currentUserAlias={currentUser?.user_metadata?.alias ?? null}
        currentUserAvatar={currentUser?.user_metadata?.avatar_url ?? null}
      />
    </main>
  )
}
