import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { CampoForm } from './CampoForm'

export const revalidate = 0

export default async function NuevoCampoPage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/campos/nuevo')
  }

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .eq('status', 'activo')
    .in('rol_plataforma', ['founder', 'admin'])

  const teamIds = Array.from(
    new Set((memberships ?? []).map((m) => m.team_id as string))
  )

  let teamsForSelect: { id: string; nombre: string }[] = []

  if (teamIds.length > 0) {
    const { data: teamsRows } = await supabase
      .from('teams')
      .select('id, nombre')
      .in('id', teamIds)
      .eq('status', 'activo')
      .order('nombre', { ascending: true })

    teamsForSelect = (teamsRows ?? []).map((t) => ({
      id: t.id as string,
      nombre: String(t.nombre ?? ''),
    }))
  }

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] px-6 py-10 text-[#111111]">
      <CampoForm teamsForSelect={teamsForSelect} />
    </main>
  )
}
