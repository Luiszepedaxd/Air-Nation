import { Suspense } from 'react'
import { DarkModeInit } from '@/components/DarkModeInit'
import { ForceUpdateGate } from '@/components/ForceUpdateGate'
import { PushNotifManager } from '@/components/PushNotifManager'
import BetaBanner from '@/components/ui/BetaBanner'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { PortalNav } from './PortalNav'

/**
 * El portal del dueño tiene su propia nav (`PortalNav`), así que no usa
 * `AppShell`: mismo mecanismo que `/admin`, donde el layout de la sección
 * monta su propio shell en vez del chrome de jugador (MobileHeader +
 * BottomNav). Lo que sí se conserva de AppShell es lo ambiental —
 * push, gate de versión, modo oscuro — y el scroll root
 * `#dashboard-scroll-root` contra el que las tabs hacen sticky.
 */
export default async function MiCampoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const userId = user?.id

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F4F4F4]">
      {/* Suspense porque PortalNav lee el query string (`?tab=`). */}
      <Suspense fallback={null}>
        <PortalNav />
      </Suspense>
      <div
        id="dashboard-scroll-root"
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          overscrollBehavior: 'contain',
        }}
      >
        <BetaBanner />
        {children}
      </div>
      {userId != null && userId !== '' ? (
        <PushNotifManager userId={userId} />
      ) : null}
      <ForceUpdateGate />
      <DarkModeInit />
    </div>
  )
}
