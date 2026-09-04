import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../../../supabase-server'
import { WristModeClient } from './WristModeClient'

export default async function ArbitroPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { roundId?: string }
}) {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const roundId = searchParams.roundId
  if (!roundId) redirect(`/dashboard/torneos/${params.id}`)

  return (
    <WristModeClient
      tournamentId={params.id}
      roundId={roundId}
      userId={user.id}
    />
  )
}
