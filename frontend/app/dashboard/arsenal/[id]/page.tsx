import { redirect, notFound } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../../supabase-server'
import { ReplicaDetailClient } from './ReplicaDetailClient'
import type { ReplicaRow } from '../ArsenalClient'

export default async function ReplicaDetailPage({ params }: { params: { id: string } }) {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: replica } = await supabase
    .from('arsenal')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (!replica) notFound()

  const isOwner = replica.user_id === user.id

  return (
    <ReplicaDetailClient
      replica={replica as ReplicaRow}
      isOwner={isOwner}
      currentUserId={user.id}
    />
  )
}
