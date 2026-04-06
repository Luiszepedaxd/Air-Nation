import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '../supabase-public'
import { PlayerProfileClient } from './PlayerProfileClient'

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

export type PublicUserProfile = {
  id: string
  alias: string | null
  nombre: string | null
  ciudad: string | null
  rol: string | null
  avatar_url: string | null
  foto_portada_url: string | null
  bio: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
  facebook: string | null
  member_number: string | number | null
  created_at: string
  perfil_publico: boolean | null
  teams: { id: string; nombre: string; slug: string } | null
}

export type PlayerPostRow = {
  id: string
  content: string | null
  fotos_urls: string[] | null
  created_at: string
}

export type PlayerEventRow = {
  id: string
  title: string | null
  fecha: string | null
  imagen_url: string | null
  status: string | null
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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 12a4 4 0 104 4V4a5 5 0 005 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M13.5 10.5h-2v-1c0-.5.3-.6.8-.6h1.2V6.2h-2.1c-2 0-2.9 1-2.9 2.6V10.5H7v2.8h1.5V22h3.2v-8.7h2.2l.3-2.8z"
        fill="currentColor"
      />
    </svg>
  )
}

function socialHref(kind: 'instagram' | 'tiktok' | 'youtube' | 'facebook', value: string): string {
  const v = value.trim()
  if (!v) return '#'
  if (v.startsWith('http')) return v
  if (kind === 'instagram') return `https://instagram.com/${v.replace(/^@/, '')}`
  if (kind === 'tiktok') return `https://tiktok.com/@${v.replace(/^@/, '')}`
  if (kind === 'youtube') return v.startsWith('http') ? v : `https://youtube.com/${v}`
  return `https://facebook.com/${v.replace(/^@/, '')}`
}

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

  const initial = (user.alias?.trim()?.[0] || '?').toUpperCase()
  const hasMemberNo =
    user.member_number != null && String(user.member_number).trim() !== ''

  const ig = user.instagram?.trim()
  const tt = user.tiktok?.trim()
  const yt = user.youtube?.trim()
  const fb = user.facebook?.trim()

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="w-full">
        <div className="relative w-full">
          <div className="relative h-[200px] w-full overflow-hidden bg-[#111111] md:h-[260px]">
            {user.foto_portada_url ? (
              <img
                src={user.foto_portada_url}
                alt=""
                width={1920}
                height={720}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-1/2 z-[1] flex w-full -translate-x-1/2 translate-y-1/2 justify-center">
            <div
              className="pointer-events-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-[#CC4B37] [border:4px_solid_#FFFFFF]"
              style={{ borderRadius: '50%' }}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[28px] text-[#FFFFFF]" style={jost}>
                  {initial}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[960px] px-4 pb-6 pt-16 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h1
              style={jost}
              className="text-[24px] font-extrabold uppercase leading-tight text-[#111111] md:text-[28px]"
            >
              {user.alias}
            </h1>
            {hasMemberNo ? (
              <span
                style={jost}
                className="inline-flex items-center gap-1 rounded-[2px] bg-[#111111] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
              >
                <CheckIcon />
                VERIFICADO
              </span>
            ) : null}
          </div>

          <p
            className="mt-3 text-[14px] leading-relaxed text-[#666666]"
            style={lato}
          >
            {[user.ciudad, user.rol ? rolLabel(user.rol) : null]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>

          {hasMemberNo ? (
            <p
              style={jost}
              className="mt-3 text-[14px] font-extrabold uppercase text-[#CC4B37]"
            >
              MIEMBRO #{user.member_number}
            </p>
          ) : null}

          {user.teams ? (
            <p className="mt-3 text-[14px] text-[#111111]" style={lato}>
              <a
                href={`/equipos/${encodeURIComponent(user.teams.slug)}`}
                className="font-semibold text-[#111111] underline decoration-[#EEEEEE] underline-offset-2 transition-colors hover:text-[#CC4B37] hover:decoration-[#CC4B37]"
              >
                {user.teams.nombre}
              </a>
            </p>
          ) : null}

          {(ig || tt || yt || fb) ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {ig ? (
                <a
                  href={socialHref('instagram', ig)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                  style={lato}
                >
                  <InstagramIcon />
                  <span>Instagram</span>
                </a>
              ) : null}
              {tt ? (
                <a
                  href={socialHref('tiktok', tt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                  style={lato}
                >
                  <TikTokIcon />
                  <span>TikTok</span>
                </a>
              ) : null}
              {yt ? (
                <a
                  href={socialHref('youtube', yt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                  style={lato}
                >
                  <YouTubeIcon />
                  <span>YouTube</span>
                </a>
              ) : null}
              {fb ? (
                <a
                  href={socialHref('facebook', fb)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                  style={lato}
                >
                  <FacebookIcon />
                  <span>Facebook</span>
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <PlayerProfileClient
        user={user}
        posts={posts}
        events={events}
        rolLabels={ROL_LABELS}
      />
    </main>
  )
}
