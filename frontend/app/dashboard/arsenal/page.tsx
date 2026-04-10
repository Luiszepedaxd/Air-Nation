import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { ArsenalClient } from './ArsenalClient'

export default async function ArsenalPage() {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRow } = await supabase
    .from('users')
    .select('ciudad, estado, alias, nombre, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const { data: replicas } = await supabase
    .from('arsenal')
    .select('id, nombre, sistema, mecanismo, condicion, upgrades, serial, foto_url, descripcion, ciudad, estado, verificada, en_venta, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <ArsenalClient
      userId={user.id}
      userCiudad={userRow?.ciudad ?? null}
      userEstado={userRow?.estado ?? null}
      replicas={replicas ?? []}
    />
  )
}
