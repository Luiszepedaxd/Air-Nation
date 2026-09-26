import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense, cache } from 'react'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { createPublicSupabaseClient } from '../supabase-public'
import { fetchHistorialJugador } from '@/lib/ranking'
import { PlayerProfileClient } from './PlayerProfileClient'
import { PlayerHero } from './PlayerHero'
import { RankingJugadorSection } from './RankingJugadorSection'
import type { PlayerEventRow, PlayerPostRow, PublicReplicaRow, PublicUserProfile } from './types'

export const revalidate = 0
export const dynamic = 'force-dynamic'

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

/**
 * Perfil público completo.
 *
 * Wrapped in `cache()` so `generateMetadata` and the page component share a
 * single execution per request instead of running the whole query set twice.
 * Inside, every query that doesn't depend on another one is issued in parallel:
 * the profile used to cost ~7 sequential Supabase round-trips before first byte.
 */
const fetchPublicProfile = cache(async (id: string) => {
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

  type TeamRow = { id: string; nombre: string; slug: string; logo_url: string | null }

  const teamPromise: PromiseLike<TeamRow | null> = row.team_id
    ? supabase
        .from('teams')
        .select('id, nombre, slug, logo_url')
        .eq('id', row.team_id)
        .maybeSingle()
        .then(({ data }) => (data as TeamRow | null) ?? null)
    : Promise.resolve(null)

  const memberRowsPromise = supabase
    .from('team_members')
    .select('rol_plataforma, player_status, team_id, teams(id, nombre, slug, logo_url)')
    .eq('user_id', row.id)
    .eq('status', 'activo')
    .then(({ data }) => data)

  // Posts + alias de menciones: dos queries encadenadas que corren en paralelo
  // con el resto de bloques del perfil.
  const postsPromise: Promise<PlayerPostRow[]> = (async () => {
    const { data: postsData } = await supabase
      .from('player_posts')
      .select(
        'id, content, fotos_urls, video_url, video_duration_s, mentions, created_at'
      )
      .eq('user_id', id)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!postsData) return []

    const mentionIds = new Set<string>()
    for (const p of postsData as { mentions?: unknown }[]) {
      const m = p.mentions
      if (Array.isArray(m)) {
        for (const uid of m) mentionIds.add(String(uid))
      }
    }

    const aliasById = new Map<string, string>()
    if (mentionIds.size > 0) {
      const { data: mu } = await supabase
        .from('users')
        .select('id, alias')
        .in('id', Array.from(mentionIds))
      for (const u of mu ?? []) {
        const mentionRow = u as { id: string; alias: string | null }
        if (mentionRow.alias?.trim())
          aliasById.set(mentionRow.id, mentionRow.alias.trim())
      }
    }

    return (postsData as PlayerPostRow[]).map((postRow) => {
      const mids = postRow.mentions
      const mentionAliasById: Record<string, string> = {}
      if (Array.isArray(mids)) {
        for (const uid of mids) {
          const sid = String(uid)
          const al = aliasById.get(sid)
          if (al) mentionAliasById[sid] = al
        }
      }
      return {
        ...postRow,
        ...(Object.keys(mentionAliasById).length > 0
          ? { mentionAliasById }
          : {}),
      }
    })
  })()

  const eventsPromise: PromiseLike<PlayerEventRow[]> = supabase
    .from('event_rsvps')
    .select('events(id, title, fecha, imagen_url, status)')
    .eq('user_id', id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(6)
    .then(({ data }) => {
      if (!data) return []
      return (data as unknown as { events: PlayerEventRow | PlayerEventRow[] | null }[])
        .map((r) => {
          const e = r.events
          if (!e) return null
          return Array.isArray(e) ? e[0] : e
        })
        .filter((e): e is PlayerEventRow => e !== null)
    })
    // event_rsvps table may not exist yet
    .then(undefined, () => [] as PlayerEventRow[])

  const replicasPromise: PromiseLike<PublicReplicaRow[]> = supabase
    .from('arsenal')
    .select('id, nombre, sistema, mecanismo, condicion, foto_url, verificada, ciudad, estado')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .then(({ data }) => (data as PublicReplicaRow[] | null) ?? [])

  const [teamData, memberRows, posts, events, replicas] = await Promise.all([
    teamPromise,
    memberRowsPromise,
    postsPromise,
    eventsPromise,
    replicasPromise,
  ])

  let teams_list: PublicUserProfile['teams_list'] = undefined
  if (memberRows && memberRows.length > 0) {
    const seen = new Set<string>()
    const list: NonNullable<PublicUserProfile['teams_list']> = []
    for (const mr of memberRows as {
      rol_plataforma: string | null
      player_status: string | null
      team_id: string
      teams: TeamRow | TeamRow[] | null
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
        player_status:
          (mr.player_status as 'activo' | 'reserva' | 'en_prueba' | null) ??
          'activo',
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

  return { user, posts, events, replicas }
})

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

/**
 * El historial de ranking son 4 queries encadenadas y solo lo tiene una minoría
 * de jugadores, así que se transmite por streaming fuera de la ruta crítica en
 * lugar de retrasar el render del perfil completo.
 */
async function RankingJugadorSlot({ userId }: { userId: string }) {
  const historial = await fetchHistorialJugador(
    createPublicSupabaseClient(),
    userId
  )
  if (!historial || historial.resultados.length === 0) return null
  return <RankingJugadorSection historial={historial} />
}

export default async function PublicProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabaseServer = createDashboardSupabaseServerClient()
  const supabasePublic = createPublicSupabaseClient()

  // El perfil y la sesión no dependen entre sí: una sola espera para ambos.
  const [result, currentUser] = await Promise.all([
    fetchPublicProfile(params.id),
    getCurrentUser(),
  ])
  if (!result) notFound()

  const { user, posts, events, replicas } = result
  const isViewingOther = !!currentUser && currentUser.id !== user.id

  // Segunda (y última) ola: todo lo que necesita el id del perfil y/o la sesión.
  const [
    viewerRowRes,
    blocksRes,
    { count: followersCount },
    { count: followingCount },
    followRow,
    teamMemberRes,
  ] = await Promise.all([
    currentUser
      ? supabaseServer
          .from('users')
          .select('app_role')
          .eq('id', currentUser.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    isViewingOther
      ? supabaseServer
          .from('user_blocks')
          .select('blocker_id, blocked_id')
          .or(
            `and(blocker_id.eq.${currentUser!.id},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${currentUser!.id})`
          )
      : Promise.resolve({ data: null, error: null }),
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
          .select('rol_plataforma, player_status')
          .eq('user_id', user.id)
          .eq('team_id', user.team_id)
          .eq('status', 'activo')
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isAdmin =
    (viewerRowRes.data as { app_role?: string } | null)?.app_role === 'admin'

  // Verificar bloqueo bidireccional
  let isBlockedByMe = false
  let amIBlockedByThem = false
  if ('error' in blocksRes && blocksRes.error) {
    console.error('[u/profile] user_blocks query error:', blocksRes.error)
  }
  for (const b of (blocksRes.data as
    | { blocker_id: string; blocked_id: string }[]
    | null) ?? []) {
    if (b.blocker_id === currentUser!.id && b.blocked_id === user.id) {
      isBlockedByMe = true
    }
    if (b.blocker_id === user.id && b.blocked_id === currentUser!.id) {
      amIBlockedByThem = true
    }
  }

  // Si el otro usuario me bloqueó, mostrar perfil no disponible
  if (amIBlockedByThem) {
    return (
      <main className="flex min-h-screen min-w-[375px] items-center justify-center bg-[#FFFFFF] px-8 py-8 text-[#111111]">
        <div className="text-center">
          <h1
            style={jost}
            className="text-[24px] font-extrabold uppercase leading-tight text-[#111111]"
          >
            Perfil no disponible
          </h1>
          <p className="mt-4 text-[14px] text-[#666666]" style={lato}>
            Este perfil no está disponible
          </p>
        </div>
      </main>
    )
  }

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

  const isVerified =
    !!user.avatar_url &&
    !!user.foto_portada_url &&
    (replicas.length > 0 || posts.length > 0)

  const teamRole = mapTeamRole(
    teamMemberRes.data?.rol_plataforma as string | undefined
  )

  const playerStatusMain =
    (teamMemberRes.data?.player_status as
      | 'activo'
      | 'reserva'
      | 'en_prueba'
      | null
      | undefined) ?? null

  const userWithStatus: PublicUserProfile = {
    ...user,
    player_status: playerStatusMain,
  }

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PlayerHero
        user={userWithStatus}
        subtitle={subtitle}
        followersCount={followersCount ?? 0}
        followingCount={followingCount ?? 0}
        isFollowing={!!followRow?.data}
        currentUserId={currentUser?.id ?? null}
        teamRole={teamRole}
        isVerified={isVerified}
        arsenalCount={replicas.length}
        postsCount={posts.length}
        isBlockedByMe={isBlockedByMe}
      />

      {!isBlockedByMe && (
        <Suspense fallback={null}>
          <RankingJugadorSlot userId={user.id} />
        </Suspense>
      )}

      {isBlockedByMe ? (
        <div className="mx-auto max-w-[960px] px-4 py-12 md:px-6 md:py-16">
          <div className="border border-[#EEEEEE] bg-[#F9F9F9] px-6 py-8 text-center">
            <p style={jost} className="text-[14px] font-extrabold uppercase text-[#111111] mb-2">
              Has bloqueado a este jugador
            </p>
            <p style={lato} className="text-[13px] text-[#666666]">
              No puedes ver su contenido. Toca el botón de bloqueo arriba para desbloquearlo.
            </p>
          </div>
        </div>
      ) : (
        <PlayerProfileClient
          user={user}
          posts={posts}
          events={events}
          replicas={replicas}
          rolLabels={ROL_LABELS}
          currentUserId={currentUser?.id ?? null}
          isAdmin={isAdmin}
          showPostBox={currentUser?.id === user.id}
          currentUserAlias={currentUser?.user_metadata?.alias ?? null}
          currentUserAvatar={currentUser?.user_metadata?.avatar_url ?? null}
        />
      )}
    </main>
  )
}
