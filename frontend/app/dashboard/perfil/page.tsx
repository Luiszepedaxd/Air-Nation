import { redirect } from 'next/navigation'
import { fetchPendingJoinRequestsForModerator } from '@/lib/pending-join-requests'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { type MisEquipoItem } from './MisEquiposSection'
import { PerfilTabsClient } from './PerfilTabsClient'

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
  let teamSlug: string | null = null
  if (row.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('nombre, slug')
      .eq('id', row.team_id)
      .maybeSingle()
    teamNombre = team?.nombre ?? null
    teamSlug = (team?.slug as string | undefined) ?? null
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

    const byId = new Map((teamsRows ?? []).map((t) => [t.id as string, t]))

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

  const initialJoinRequests = await fetchPendingJoinRequestsForModerator(
    supabase,
    authUser.id
  )

  const { data: pendingJoinRows } = await supabase
    .from('team_join_requests')
    .select('id, teams ( nombre )')
    .eq('user_id', authUser.id)
    .eq('status', 'pendiente')

  const pendingJoinPending: { id: string; nombre: string }[] = []
  for (const r of pendingJoinRows ?? []) {
    const raw = r as {
      id?: string
      teams?: { nombre?: string } | { nombre?: string }[] | null
    }
    const t = raw.teams
    const n = Array.isArray(t) ? t[0] : t
    const name = n?.nombre?.trim()
    const rid = raw.id
    if (name && rid) pendingJoinPending.push({ id: rid, nombre: name })
  }

  return (
    <PerfilTabsClient
      user={row}
      teamNombre={teamNombre}
      teamSlug={teamSlug}
      misEquipos={misEquipos}
      initialJoinRequests={initialJoinRequests}
      isAdmin={isAdmin}
      pendingJoinPending={pendingJoinPending}
    />
  )
}
