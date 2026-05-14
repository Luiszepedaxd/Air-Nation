import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'
import { BoothAdminClient } from './BoothAdminClient'

export const metadata: Metadata = {
  title: 'Modo Booth · Admin AirNation',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type BoothEventRow = {
  id: string
  event_name: string
  active: boolean
  created_at: string
  updated_at: string
}

export default async function BoothAdminPage() {
  // Validar admin
  const userClient = createAdminSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await userClient
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  if (!me || (me as { app_role: string }).app_role !== 'admin') {
    redirect('/admin')
  }

  const supabase = createAdminClient()

  // Cargar todos los eventos
  const { data: eventosRaw } = await supabase
    .from('booth_events')
    .select('id, event_name, active, created_at, updated_at')
    .order('created_at', { ascending: false })

  const eventos: BoothEventRow[] = (eventosRaw ?? []) as BoothEventRow[]

  // Contar registros por evento (con un solo query agregado)
  const eventNames = eventos.map((e) => e.event_name)
  const conteos = new Map<string, number>()

  if (eventNames.length > 0) {
    // Hacemos un query simple agrupado por registered_at_event
    const { data: usersRaw } = await supabase
      .from('users')
      .select('registered_at_event')
      .in('registered_at_event', eventNames)

    for (const r of usersRaw ?? []) {
      const ev = (r as { registered_at_event: string | null }).registered_at_event
      if (!ev) continue
      conteos.set(ev, (conteos.get(ev) ?? 0) + 1)
    }
  }

  const eventosConCount = eventos.map((e) => ({
    ...e,
    count: conteos.get(e.event_name) ?? 0,
  }))

  return <BoothAdminClient initialEventos={eventosConCount} />
}
