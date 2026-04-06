import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '../supabase-public'
import { PlayerProfileClient } from './PlayerProfileClient'
import { PlayerHero } from './PlayerHero'
import type { PlayerEventRow, PlayerPostRow, PublicUserProfile } from './types'

export const revalidate = 0

export type { PlayerEventRow, PlayerPostRow, PublicUserProfile }

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

  let teamData: { id: string; nombre: string; slug: string } | null = null
  if (row.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('id, nombre, slug')
      .eq('id', row.team_id)
      .maybeSingle()
    if (team) teamData = team as { id: string; nombre: string; slug: string }
  }

  const user: PublicUserProfile = {
    ...(row as unknown as Omit<PublicUserProfile, 'teams'>),
    teams: teamData,
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

  return { user, posts, events }
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
  return {
    title: `${user.alias} — AirNation`,
    description: descParts.join('. '),
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

  const { user, posts, events } = result

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

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PlayerHero user={user} subtitle={subtitle} />

      <PlayerProfileClient
        user={user}
        posts={posts}
        events={events}
        rolLabels={ROL_LABELS}
      />
    </main>
  )
}
