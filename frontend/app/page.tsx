import { Suspense } from 'react'
import { createDashboardSupabaseServerClient } from './dashboard/supabase-server'
import { FeedHome } from './dashboard/FeedHome'
import { SaludoSection, SaludoSkeleton } from './dashboard/feed-saludo'
import PublicSiteHeader from '@/components/layout/PublicSiteHeader'

export const revalidate = 0

export default async function HomePage() {
  let userId: string | null = null
  let userAlias: string | null = null
  let userAvatar: string | null = null
  let isAdmin = false
  let userTeams: {
    id: string
    nombre: string
    slug: string
    logo_url: string | null
    rol: 'founder' | 'admin'
  }[] = []
  let userFields: {
    id: string
    nombre: string
    slug: string
    foto_portada_url: string | null
  }[] = []

  try {
    const supabase = createDashboardSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      userId = user.id

      const { data: profile } = await supabase
        .from('users')
        .select('alias, avatar_url, app_role')
        .eq('id', user.id)
        .maybeSingle()

      userAlias = profile?.alias ?? null
      userAvatar = profile?.avatar_url ?? null
      isAdmin = profile?.app_role === 'admin'

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

      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, nombre, slug, logo_url')
          .in('id', teamIds)
          .eq('status', 'activo')
        userTeams = (teamsData ?? []).map((t) => {
          const row = t as { id: string; nombre: string; slug: string; logo_url: string | null }
          return { ...row, rol: rolByTeamId.get(row.id) ?? 'admin' }
        })
      }

      const { data: fieldsData } = await supabase
        .from('fields')
        .select('id, nombre, slug, foto_portada_url')
        .eq('created_by', user.id)
        .eq('status', 'aprobado')
      userFields = (fieldsData ?? []) as typeof userFields
    }
  } catch {
    // Sin sesión o error — continuar como guest
  }

  return (
    <main className="min-h-full bg-[#FFFFFF]">
      <PublicSiteHeader />
      {userId && (
        <div className="w-full px-4 pt-4 pb-2 md:mx-auto md:max-w-[680px] md:px-6">
          <Suspense fallback={<SaludoSkeleton />}>
            <SaludoSection />
          </Suspense>
        </div>
      )}
      <div className="w-full px-4 md:mx-auto md:max-w-[680px] md:px-6 pb-10">
        <Suspense fallback={null}>
          <FeedHome
            userId={userId}
            userAlias={userAlias}
            userAvatar={userAvatar}
            userTeams={userTeams}
            userFields={userFields}
            isAdmin={isAdmin}
          />
        </Suspense>
      </div>
    </main>
  )
}
