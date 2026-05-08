import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { CredencialClient } from '@/components/credential/CredencialClient'
import type { CredentialUserData } from '@/components/credential/CredentialCard'

export const revalidate = 60

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type UserRow = {
  id: string
  nombre: string | null
  alias: string | null
  ciudad: string | null
  rol: string | null
  avatar_url: string | null
  foto_credencial_url: string | null
  credencial_nombre_completo: string | null
  credencial_fecha_nacimiento: string | null
  member_number: string | number | null
  created_at: string
}

export default async function CredencialPage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const { data: row, error } = await supabase
    .from('users')
    .select(
      'id, nombre, alias, ciudad, rol, avatar_url, foto_credencial_url, credencial_nombre_completo, credencial_fecha_nacimiento, member_number, created_at'
    )
    .eq('id', session.user.id)
    .maybeSingle()

  if (error || !row) {
    redirect('/dashboard')
  }

  let teamNombre: string | null = null
  let teamsActivos: string[] = []
  if (row) {
    const { data: userWithTeam } = await supabase
      .from('users')
      .select('teams(nombre)')
      .eq('id', session.user.id)
      .maybeSingle()

    const teams = (userWithTeam as any)?.teams
    if (teams) {
      teamNombre = Array.isArray(teams) ? teams[0]?.nombre ?? null : teams.nombre
    }

    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id, status, teams(nombre)')
      .eq('user_id', session.user.id)
      .eq('status', 'activo')

    if (memberships && memberships.length > 0) {
      teamsActivos = memberships
        .map((m: any) => {
          const t = m.teams
          if (!t) return null
          if (Array.isArray(t)) return t[0]?.nombre ?? null
          return t.nombre ?? null
        })
        .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
    }
  }

  const r = row as UserRow

  const data: CredentialUserData = {
    id: r.id,
    nombre: r.nombre,
    alias: r.alias,
    ciudad: r.ciudad,
    rol: r.rol,
    avatar_url: r.avatar_url,
    foto_credencial_url: r.foto_credencial_url,
    credencial_nombre_completo: r.credencial_nombre_completo,
    credencial_fecha_nacimiento: r.credencial_fecha_nacimiento,
    member_number: r.member_number,
    created_at: r.created_at,
    teamNombre,
    teamsActivos,
  }

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <h1
        style={jost}
        className="text-[24px] font-extrabold uppercase leading-tight text-[#111111]"
      >
        MI CREDENCIAL
      </h1>
      <p style={lato} className="mt-2 text-[14px] leading-relaxed text-[#666666]">
        Tu identificación digital AirNation
      </p>
      <CredencialClient data={data} />
    </main>
  )
}
