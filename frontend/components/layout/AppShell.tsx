import BottomNav from '@/components/dashboard/BottomNav'
import { DarkModeInit } from '@/components/DarkModeInit'
import { ForceUpdateGate } from '@/components/ForceUpdateGate'
import MobileHeader from '@/components/layout/MobileHeader'
import { PushNotifManager } from '@/components/PushNotifManager'
import BetaBanner from '@/components/ui/BetaBanner'
import { getCurrentUser } from '@/lib/supabase/current-user'

export default async function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  const userId = user?.id

  return (
    <div
      // Shell en blanco para que la franja del inset superior (status bar)
      // se vea blanca como cuando el padding vivía en MobileHeader. El gris
      // de fondo va en el scroll root, que cubre todo lo de abajo.
      className="h-[100dvh] flex flex-col bg-[#FFFFFF]"
      // Inset superior del shell (status bar). Único punto donde se aplica:
      // MobileHeader no renderiza en rutas raíz (/dashboard/perfil, /campos…)
      // y sin esto sus tabs sticky quedan debajo del reloj en Android 15+,
      // donde el WebView es edge-to-edge a la fuerza y StatusBar
      // overlaysWebView:false ya no tiene efecto. NO duplicarlo por pantalla.
      // var(--safe-area-inset-top) la inyecta Capacitor; env() la expone el
      // WebView 140+. Son el mismo valor, max() no suma. 0 en iOS/Android ≤14.
      style={{ paddingTop: 'max(env(safe-area-inset-top), var(--safe-area-inset-top, 0px))' }}
    >
      <MobileHeader />
      <div
        id="dashboard-scroll-root"
        className="flex-1 overflow-y-auto bg-[#F4F4F4] lg:pb-0 lg:pt-16"
        style={{
          paddingBottom: 'max(calc(3.5rem + env(safe-area-inset-bottom)), calc(3.5rem + 12px))',
          overscrollBehavior: 'contain',
        }}
      >
        <BetaBanner />
        {children}
      </div>
      {userId != null && userId !== '' ? <BottomNav /> : null}
      {userId != null && userId !== '' ? (
        <PushNotifManager userId={userId} />
      ) : null}
      <ForceUpdateGate />
      <DarkModeInit />
    </div>
  )
}
