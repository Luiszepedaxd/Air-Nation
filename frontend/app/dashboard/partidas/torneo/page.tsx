import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../../supabase-server'
import { TorneoHub } from './TorneoHub'

export default async function TorneoPage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <TorneoHub />
}
