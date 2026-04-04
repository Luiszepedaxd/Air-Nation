import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { AdminClient } from './AdminClient'
import type { TeamJoinRequestAdminRow, TeamMemberAdminRow } from './types'

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function isModeratorRole(rol: string | null | undefined) {
  const r = (rol || '').toLowerCase().trim()
  return r === 'founder' || r === 'admin'
}

function sortMembers(a: TeamMemberAdminRow, b: TeamMemberAdminRow) {
  const rank = (r: string | null) => {
    const x = (r || '').toLowerCase()
    if (x === 'founder') return 1
    if (x === 'admin') return 2
    return 3
  }
  const dr = rank(a.rol_plataforma) - rank(b.rol_plataforma)
  if (dr !== 0) return dr
  const an = (a.nombre || a.alias || '').toLowerCase()
  const bn = (b.nombre || b.alias || '').toLowerCase()
  return an.localeCompare(bn, 'es')
}

export default async function EquipoAdminPage({
  params,
}: {
  params: { slug: string }
}) {
  const slug = params.slug
  const supabase = createDashboardSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/equipos/${slug}/admin`)}`)
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, nombre, slug, ciudad, logo_url, status')
    .eq('slug', slug)
    .maybeSingle()

  if (teamError || !team) {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  const row = team as { status?: string | null }
  if (row.status && row.status !== 'activo') {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  const teamId = team.id as string

  const { data: membership } = await supabase
    .from('team_members')
    .select('rol_plataforma')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .eq('status', 'activo')
    .maybeSingle()

  if (!membership || !isModeratorRole(membership.rol_plataforma as string)) {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  const viewerRol = (membership.rol_plataforma as string | null) ?? ''

  const { data: rawJoin, error: joinErr } = await supabase
    .from('team_join_requests')
    .select(
      `
      id,
      team_id,
      user_id,
      mensaje,
      created_at,
      users ( nombre, alias, avatar_url, ciudad )
    `
    )
    .eq('team_id', teamId)
    .eq('status', 'pendiente')
    .order('created_at', { ascending: false })

  const initialJoinRequests: TeamJoinRequestAdminRow[] =
    joinErr || !rawJoin
      ? []
      : (rawJoin as {
          id: string
          team_id: string
          user_id: string
          mensaje: string | null
          created_at: string
          users: unknown
        }[]).map((r) => {
          const u = one(r.users) as {
            nombre: string | null
            alias: string | null
            avatar_url: string | null
            ciudad: string | null
          } | null
          return {
            id: r.id,
            team_id: r.team_id,
            user_id: r.user_id,
            mensaje: r.mensaje,
            created_at: r.created_at,
            nombre: u?.nombre ?? null,
            alias: u?.alias ?? null,
            avatar_url: u?.avatar_url ?? null,
            ciudad: u?.ciudad ?? null,
          }
        })

  const { data: rawMembers, error: memErr } = await supabase
    .from('team_members')
    .select(
      `
      id,
      user_id,
      rol_plataforma,
      rango_militar,
      users ( nombre, alias, avatar_url, ciudad )
    `
    )
    .eq('team_id', teamId)
    .eq('status', 'activo')

  let initialMembers: TeamMemberAdminRow[] =
    memErr || !rawMembers
      ? []
      : (rawMembers as {
          id: string
          user_id: string
          rol_plataforma: string | null
          rango_militar: string | null
          users: unknown
        }[]).map((r) => {
          const u = one(r.users) as {
            nombre: string | null
            alias: string | null
            avatar_url: string | null
            ciudad: string | null
          } | null
          return {
            id: r.id,
            user_id: r.user_id,
            rol_plataforma: r.rol_plataforma,
            rango_militar: r.rango_militar,
            nombre: u?.nombre ?? null,
            alias: u?.alias ?? null,
            avatar_url: u?.avatar_url ?? null,
            ciudad: u?.ciudad ?? null,
          }
        })

  initialMembers = [...initialMembers].sort(sortMembers)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <AdminClient
        slug={slug}
        teamId={teamId}
        teamNombre={team.nombre as string}
        teamCiudad={(team.ciudad as string | null) ?? null}
        logoUrl={(team.logo_url as string | null) ?? null}
        viewerUserId={user.id}
        viewerRol={viewerRol}
        initialJoinRequests={initialJoinRequests}
        initialMembers={initialMembers}
      />
    </div>
  )
}
