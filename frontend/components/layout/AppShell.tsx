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
          // 'none', no 'contain': contain solo corta el scroll chaining, el
          // rubber-band local de iOS sigue. Al rebotar en el tope, el contenido
          // baja y deja ver el gris de este scroller bajo la franja blanca del
          // inset, y las tabs sticky top-0 (perfil) viajan con él — sticky no
          // sube de su posición estática con scrollTop negativo. 'none' mata el
          // rebote y sigue conteniendo el chaining.
          // ponytail: iOS <16 no soporta overscroll-behavior (mínimo del
          // proyecto: iOS 15) — ahí sigue rebotando como hasta ahora.
          overscrollBehavior: 'none',
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
