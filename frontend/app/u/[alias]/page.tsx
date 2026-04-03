import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '../supabase-public'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

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

type PublicUser = {
  alias: string | null
  ciudad: string | null
  rol: string | null
  avatar_url: string | null
  member_number: string | number | null
  created_at: string
  team_id: string | null
}

function formatDMY(iso: string) {
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return ''
  }
}

async function fetchPublicProfile(alias: string): Promise<{
  user: PublicUser
  teamNombre: string | null
} | null> {
  const supabase = createPublicSupabaseClient()
  const { data: row, error } = await supabase
    .from('users')
    .select('alias, ciudad, rol, avatar_url, member_number, created_at, team_id')
    .eq('alias', alias)
    .maybeSingle()

  if (error || !row || !row.alias) return null

  const user = row as PublicUser
  let teamNombre: string | null = null
  if (user.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('nombre')
      .eq('id', user.team_id)
      .maybeSingle()
    teamNombre = team?.nombre ?? null
  }

  return { user, teamNombre }
}

export async function generateMetadata({
  params,
}: {
  params: { alias: string }
}): Promise<Metadata> {
  const decoded = decodeURIComponent(params.alias)
  const result = await fetchPublicProfile(decoded)
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

export default async function PublicProfilePage({
  params,
}: {
  params: { alias: string }
}) {
  const decoded = decodeURIComponent(params.alias)
  const result = await fetchPublicProfile(decoded)
  if (!result) notFound()

  const { user, teamNombre } = result
  const initial = (user.alias?.trim()?.[0] || '?').toUpperCase()
  const hasMemberNo =
    user.member_number != null && String(user.member_number).trim() !== ''
  const verified = hasMemberNo

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] px-8 py-8 text-[#111111]">
      <div className="mx-auto flex max-w-[480px] flex-col items-center text-center">
        <div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#CC4B37] md:h-[120px] md:w-[120px]"
          style={{ borderRadius: '50%' }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              width={120}
              height={120}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[36px] text-[#FFFFFF]"
              style={jost}
            >
              {initial}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <h1
            style={jost}
            className="text-[24px] font-extrabold uppercase leading-tight text-[#111111]"
          >
            {user.alias}
          </h1>
          {verified ? (
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
            className="mt-4 text-[14px] font-extrabold uppercase text-[#CC4B37]"
          >
            MIEMBRO #{user.member_number}
          </p>
        ) : null}

        <p className="mt-2 text-[13px] text-[#666666]" style={lato}>
          Miembro desde {formatDMY(user.created_at)}
        </p>

        {teamNombre ? (
          <p className="mt-4 text-[14px] text-[#111111]" style={lato}>
            <span style={jost} className="mr-1 text-[10px] font-extrabold uppercase text-[#666666]">
              Equipo
            </span>
            {teamNombre}
          </p>
        ) : null}
      </div>
    </main>
  )
}
