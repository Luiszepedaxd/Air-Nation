import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { MisEquiposSection, type MisEquipoItem } from './MisEquiposSection'
import { PerfilLogoutButton } from './PerfilLogoutButton'
import { ProfileView } from './ProfileView'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export default async function PerfilPage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: row, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error || !row) redirect('/login')

  let teamNombre: string | null = null
  if (row.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('nombre')
      .eq('id', row.team_id)
      .maybeSingle()
    teamNombre = team?.nombre ?? null
  }

  const isAdmin = row.app_role === 'admin'

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id, rol_plataforma, rango_militar')
    .eq('user_id', authUser.id)
    .eq('status', 'activo')

  const teamIds = Array.from(
    new Set((memberships ?? []).map((m) => m.team_id as string))
  )

  let misEquipos: MisEquipoItem[] = []

  if (teamIds.length > 0) {
    const { data: teamsRows } = await supabase
      .from('teams')
      .select('id, nombre, slug, logo_url, ciudad, status')
      .in('id', teamIds)
      .eq('status', 'activo')

    const byId = new Map(
      (teamsRows ?? []).map((t) => [t.id as string, t])
    )

    misEquipos = (memberships ?? [])
      .map((m) => {
        const tid = m.team_id as string
        const team = byId.get(tid)
        if (!team) return null
        return {
          id: team.id as string,
          nombre: team.nombre as string,
          slug: team.slug as string,
          logo_url: team.logo_url as string | null,
          ciudad: team.ciudad as string | null,
          rol_plataforma: m.rol_plataforma as string | null,
          rango_militar: m.rango_militar as string | null,
        }
      })
      .filter((x): x is MisEquipoItem => x != null)
  }

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <h1
        style={jost}
        className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]"
      >
        MI PERFIL
      </h1>
      <ProfileView user={row} teamNombre={teamNombre} />
      <MisEquiposSection teams={misEquipos} />
      <div className="mx-auto mt-8 max-w-[640px] space-y-8">
        {isAdmin ? (
          <Link
            href="/admin"
            style={jost}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="8" height="8" stroke="#111111" strokeWidth="1.5" />
              <rect x="13" y="3" width="8" height="8" stroke="#111111" strokeWidth="1.5" />
              <rect x="3" y="13" width="8" height="8" stroke="#111111" strokeWidth="1.5" />
              <rect x="13" y="13" width="8" height="8" stroke="#111111" strokeWidth="1.5" />
            </svg>
            ADMINISTRACIÓN
          </Link>
        ) : null}
        <PerfilLogoutButton />
      </div>
    </main>
  )
}
