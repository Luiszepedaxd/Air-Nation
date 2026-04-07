import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from './supabase-server'
import { SaludoSection, SaludoSkeleton } from './feed-saludo'
import { ClearOnboardingParam } from './clear-onboarding-param'
import { FeedHome } from './FeedHome'

function fromOnboardingParam(
  from: string | string[] | undefined
): boolean {
  if (from === 'onboarding') return true
  return Array.isArray(from) && from[0] === 'onboarding'
}

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: { from?: string | string[] }
}) {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: access } = await supabase
    .from('users')
    .select('alias')
    .eq('id', user.id)
    .maybeSingle()

  const skipOnboardingGate = fromOnboardingParam(searchParams.from)
  if (!access?.alias && !skipOnboardingGate) redirect('/onboarding')

  return (
    <main className="min-h-full bg-[#FFFFFF]">
      <Suspense fallback={null}>
        <ClearOnboardingParam />
      </Suspense>
      <div className="w-full px-4 pt-4 pb-2 md:mx-auto md:max-w-[680px] md:px-6">
        <Suspense fallback={<SaludoSkeleton />}>
          <SaludoSection />
        </Suspense>
      </div>
      <div className="w-full px-4 md:mx-auto md:max-w-[680px] md:px-6 pb-10">
        <FeedHome />
      </div>
    </main>
  )
}
