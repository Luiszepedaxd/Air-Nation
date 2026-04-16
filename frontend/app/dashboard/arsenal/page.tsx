import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Arsenal — AirNation',
  robots: { index: false, follow: false },
}

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import type { ReplicaRow, MarketplaceListing } from './ArsenalClient'
import { ArsenalTabs } from './ArsenalClient'

export default async function ArsenalPage() {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: userRow },
    { data: replicas },
    { data: pendingTransfers },
    { data: listings },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('ciudad, estado, alias, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('arsenal')
      .select('id, nombre, sistema, mecanismo, condicion, upgrades, serial, foto_url, descripcion, ciudad, estado, verificada, en_venta, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('arsenal_transfers')
      .select('replica_id')
      .eq('from_user_id', user.id)
      .eq('status', 'pendiente'),
    supabase
      .from('marketplace')
      .select('id, titulo, precio, precio_original, modalidad, supercategoria, fotos_urls, status, vendido, created_at, paquetes')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const pendingIds = new Set((pendingTransfers ?? []).map(t => t.replica_id))

  const replicasWithStatus = (replicas ?? []).map(r => ({
    ...r,
    pendingTransfer: pendingIds.has(r.id),
  }))

  return (
    <Suspense fallback={null}>
      <ArsenalTabs
        userId={user.id}
        userCiudad={userRow?.ciudad ?? null}
        userEstado={userRow?.estado ?? null}
        userAlias={userRow?.alias ?? null}
        userAvatar={userRow?.avatar_url ?? null}
        replicas={replicasWithStatus as ReplicaRow[]}
        listings={(listings ?? []) as MarketplaceListing[]}
      />
    </Suspense>
  )
}
