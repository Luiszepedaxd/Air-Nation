import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from './supabase-server'
import { SaludoSection, SaludoSkeleton } from './feed-saludo'
import { ClearOnboardingParam } from './clear-onboarding-param'
import { FeedHome } from './FeedHome'

function fromOnboardingParam(
  from: string | string[] | undefined
): boolean {
  if (from === 'onboarding') return true
  return Array.isArray(from) && from[0] === 'onboarding'
}

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: { from?: string | string[] }
}) {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('alias, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const skipOnboardingGate = fromOnboardingParam(searchParams.from)
  if (!profile?.alias && !skipOnboardingGate) redirect('/onboarding')

  const { data: membershipRows } = await supabase
    .from('team_members')
    .select('team_id, rol_plataforma')
    .eq('user_id', user.id)
    .eq('status', 'activo')
    .in('rol_plataforma', ['founder', 'admin'])

  const teamIds = (membershipRows ?? []).map((m) => m.team_id as string)
  const rolByTeamId = new Map(
    (membershipRows ?? []).map((m) => [
      m.team_id as string,
      m.rol_plataforma as 'founder' | 'admin',
    ])
  )

  let userTeams: {
    id: string
    nombre: string
    slug: string
    logo_url: string | null
    rol: 'founder' | 'admin'
  }[] = []
  if (teamIds.length > 0) {
    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, nombre, slug, logo_url')
      .in('id', teamIds)
      .eq('status', 'activo')
    userTeams = (teamsData ?? []).map((t) => {
      const row = t as {
        id: string
        nombre: string
        slug: string
        logo_url: string | null
      }
      const rol = rolByTeamId.get(row.id)
      return {
        ...row,
        rol: rol ?? 'admin',
      }
    })
  }

  const { data: fieldsData } = await supabase
    .from('fields')
    .select('id, nombre, slug, foto_portada_url')
    .eq('created_by', user.id)
    .eq('status', 'aprobado')

  const userFields = (fieldsData ?? []) as {
    id: string
    nombre: string
    slug: string
    foto_portada_url: string | null
  }[]

  return (
    <main className="min-h-full bg-[#FFFFFF]">
      <Suspense fallback={null}>
        <ClearOnboardingParam />
      </Suspense>
      <div className="w-full px-4 pt-4 pb-2 md:mx-auto md:max-w-[680px] md:px-6">
        <Suspense fallback={<SaludoSkeleton />}>
          <SaludoSection />
        </Suspense>
      </div>
      <div className="w-full px-4 md:mx-auto md:max-w-[680px] md:px-6 pb-10">
        <FeedHome
          userId={user.id}
          userAlias={profile?.alias ?? null}
          userAvatar={profile?.avatar_url ?? null}
          userTeams={userTeams}
          userFields={userFields}
        />
      </div>
    </main>
  )
}
