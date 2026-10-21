import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { CheckinClient } from './CheckinClient'

export const revalidate = 0
export const metadata = {
  title: 'Check-in ARENA — AirNation',
  robots: { index: false, follow: false },
}

export default async function CheckinPage({ params }: { params: { qrToken: string } }) {
  const token = params.qrToken?.trim()
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Sin sesión no se puede saber si eres staff del campo: primero login.
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/checkin/${token}`)}`)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <CheckinClient qrToken={token} />
    </div>
  )
}
