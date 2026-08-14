import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../../supabase-server'
import { TournamentAdminClient } from './TournamentAdminClient'

export default async function TournamentPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <TournamentAdminClient tournamentId={params.id} userId={user.id} />
}
