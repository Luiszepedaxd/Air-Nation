import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { BoothRegisterClient } from './BoothRegisterClient'

export const metadata: Metadata = {
  title: 'Registro Booth · AirNation',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function BoothRegisterPage() {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase.rpc('get_active_booth_event')

  if (error) {
    console.error('[booth] rpc error', error)
    notFound()
  }

  const eventName = typeof data === 'string' && data.trim().length > 0 ? data : null

  if (!eventName) {
    notFound()
  }

  return <BoothRegisterClient eventName={eventName} />
}
