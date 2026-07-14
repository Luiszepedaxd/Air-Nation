'use client'

/**
 * CapacitorBridge — conecta Capacitor con Next.js App Router.
 *
 * Solo se activa en app nativa (no afecta web). Funciones:
 * 1. Manejar el botón físico de atrás en Android: si estás en una
 *    ruta raíz (/, /welcome, /dashboard) → minimiza la app.
 *    En cualquier otra ruta → router.back() (navega hacia atrás).
 * 2. Ocultar el splash screen una vez que React montó (más confiable
 *    que confiar solo en launchAutoHide).
 * 3. Configurar StatusBar al arranque.
 */

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isNativeApp } from '@/lib/platform'
import { supabase } from '@/lib/supabase'

const ROOT_ROUTES = new Set(['/', '/welcome', '/dashboard', '/login', '/register'])

export default function CapacitorBridge() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isNativeApp()) return

    let backHandler: { remove: () => void } | null = null
    let urlHandler: { remove: () => void } | null = null

    const init = async () => {
      try {
        const { App } = await import('@capacitor/app')
        const { SplashScreen } = await import('@capacitor/splash-screen')
        const { StatusBar, Style } = await import('@capacitor/status-bar')

        // Configurar status bar
        try {
          await StatusBar.setStyle({ style: Style.Dark })
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' })
          await StatusBar.setOverlaysWebView({ overlay: false })
        } catch {
          /* algunos devices no soportan, ignorar */
        }

        // Ocultar splash una vez que la app está lista
        try {
          await SplashScreen.hide()
        } catch {
          /* ignore */
        }

        // Configurar back button Android
        backHandler = await App.addListener('backButton', ({ canGoBack }) => {
          const currentPath = window.location.pathname
          if (ROOT_ROUTES.has(currentPath) || !canGoBack) {
            App.exitApp()
          } else {
            router.back()
          }
        })

        // Listener de deep link OAuth (airnation://auth/callback?code=...)
        urlHandler = await App.addListener('appUrlOpen', async ({ url }) => {
          try {
            if (!url.includes('auth/callback')) return

            // Cerrar el browser in-app
            try {
              const { Browser } = await import('@capacitor/browser')
              await Browser.close()
            } catch {
              /* ignore */
            }

            // Extraer el code del deep link
            const urlObj = new URL(url)
            const code = urlObj.searchParams.get('code')
            const errorParam = urlObj.searchParams.get('error')

            if (errorParam) {
              console.error('[OAuth] error en deep link:', errorParam)
              return
            }

            if (!code) {
              console.error('[OAuth] no se encontró code en deep link')
              return
            }

            // Intercambiar code por sesión
            const { error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
              console.error('[OAuth] error exchangeCodeForSession:', error.message)
              return
            }

            // Verificar perfil para decidir destino
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: profile } = await supabase
                .from('users')
                .select('alias')
                .eq('id', user.id)
                .single()

              const destination = !profile?.alias ? '/onboarding' : '/dashboard'
              window.location.href = destination
            } else {
              window.location.href = '/dashboard'
            }
          } catch (err) {
            console.error('[OAuth] error en appUrlOpen:', err)
          }
        })
      } catch (err) {
        console.warn('[CapacitorBridge] init error:', err)
      }
    }

    void init()

    return () => {
      backHandler?.remove()
      urlHandler?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-evaluar cuando cambia pathname (no necesario para listeners, pero
  // mantiene el componente reactivo a navegación).
  useEffect(() => {
    void pathname
  }, [pathname])

  return null
}
