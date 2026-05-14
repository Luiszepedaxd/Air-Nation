import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import { BoothAdminClient } from './BoothAdminClient'

export const metadata: Metadata = {
  title: 'Modo Booth · Admin AirNation',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type BoothConfigRow = {
  active: boolean
  event_name: string | null
  updated_at: string
}

export default async function BoothAdminPage() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const supabase = createAdminClient()

  const { data: configRaw } = await supabase
    .from('booth_config')
    .select('active, event_name, updated_at')
    .eq('id', 1)
    .maybeSingle()

  const config: BoothConfigRow = configRaw ?? {
    active: false,
    event_name: null,
    updated_at: new Date().toISOString(),
  }

  let countCurrent = 0
  if (config.event_name) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('registered_at_event', config.event_name)
    countCurrent = count ?? 0
  }

  const { data: eventosRaw } = await supabase
    .from('users')
    .select('registered_at_event')
    .not('registered_at_event', 'is', null)

  const counts = new Map<string, number>()
  for (const r of eventosRaw ?? []) {
    const ev = (r as { registered_at_event: string | null }).registered_at_event
    if (!ev) continue
    counts.set(ev, (counts.get(ev) ?? 0) + 1)
  }
  const eventosHistorial = Array.from(counts.entries())
    .map(([event_name, total]) => ({ event_name, total }))
    .sort((a, b) => b.total - a.total)

  return (
    <BoothAdminClient
      initialActive={config.active}
      initialEventName={config.event_name ?? ''}
      countCurrent={countCurrent}
      eventosHistorial={eventosHistorial}
    />
  )
}
