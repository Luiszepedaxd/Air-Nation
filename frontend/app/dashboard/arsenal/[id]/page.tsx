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

  const { data: pendingTransfer } = await supabase
    .from('arsenal_transfers')
    .select('id, to_user_id, nota, created_at, users!to_user_id(alias, nombre, avatar_url)')
    .eq('replica_id', params.id)
    .eq('status', 'pendiente')
    .maybeSingle()

  const pendingTransferData = pendingTransfer ? {
    id: String(pendingTransfer.id),
    nota: (pendingTransfer.nota as string | null) ?? null,
    created_at: String(pendingTransfer.created_at),
    to_user: (() => {
      const u = Array.isArray(pendingTransfer.users) ? pendingTransfer.users[0] : pendingTransfer.users
      const uo = (u ?? {}) as Record<string, unknown>
      return {
        alias: uo.alias ? String(uo.alias) : null,
        nombre: uo.nombre ? String(uo.nombre) : null,
        avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
      }
    })(),
  } : null

  const { data: incomingTransfer } = !isOwner ? await supabase
    .from('arsenal_transfers')
    .select('id, nota, created_at, users!from_user_id(alias, nombre, avatar_url)')
    .eq('replica_id', params.id)
    .eq('to_user_id', user.id)
    .eq('status', 'pendiente')
    .maybeSingle() : { data: null }

  const incomingTransferData = incomingTransfer ? {
    id: String(incomingTransfer.id),
    nota: (incomingTransfer.nota as string | null) ?? null,
    created_at: String(incomingTransfer.created_at),
    from_user: (() => {
      const u = Array.isArray(incomingTransfer.users) ? incomingTransfer.users[0] : incomingTransfer.users
      const uo = (u ?? {}) as Record<string, unknown>
      return {
        alias: uo.alias ? String(uo.alias) : null,
        nombre: uo.nombre ? String(uo.nombre) : null,
        avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
      }
    })(),
  } : null

  return (
    <ReplicaDetailClient
      replica={replica as ReplicaRow}
      isOwner={isOwner}
      currentUserId={user.id}
      pendingTransfer={pendingTransferData}
      incomingTransfer={incomingTransferData}
      originalOwnerId={String(replica.user_id)}
    />
  )
}
