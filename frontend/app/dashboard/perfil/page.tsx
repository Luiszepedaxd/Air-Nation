import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../supabase-server'
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

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <h1
        style={jost}
        className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]"
      >
        MI PERFIL
      </h1>
      <ProfileView user={row} teamNombre={teamNombre} />
    </main>
  )
}
