import BottomNav from '@/components/dashboard/BottomNav'
import { PushNotifManager } from '@/components/PushNotifManager'
import BetaBanner from '@/components/ui/BetaBanner'
import { createClient } from '@/lib/supabase/server'

export default async function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F4F4F4]">
      <div
        id="dashboard-scroll-root"
        className="flex-1 overflow-y-auto md:pb-0 md:pt-16"
        style={{
          paddingBottom: 'max(calc(3.5rem + env(safe-area-inset-bottom)), calc(3.5rem + 12px))',
          overscrollBehavior: 'contain',
        }}
      >
        <BetaBanner />
        {children}
      </div>
      <BottomNav />
      {userId != null && userId !== '' ? (
        <PushNotifManager userId={userId} />
      ) : null}
    </div>
  )
}
