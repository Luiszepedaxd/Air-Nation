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
 * 4. Escuchar deep links (confirmación de email, etc.) vía appUrlOpen.
 */

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isNativeApp } from '@/lib/platform'

const ROOT_ROUTES = new Set(['/', '/welcome', '/dashboard', '/login', '/register'])

export default function CapacitorBridge() {
  const router = useRouter()
  const pathname = usePathname()

  // Ocultar splash apenas React monta. Independiente del resto de la init
  // para que no dependa de StatusBar ni de los listeners.
  useEffect(() => {
    if (!isNativeApp()) return
    let cancelled = false
    void (async () => {
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen')
        if (cancelled) return
        await SplashScreen.hide()
      } catch {
        /* ignore */
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isNativeApp()) return

    let backHandler: { remove: () => void } | null = null
    let urlHandler: { remove: () => void } | null = null

    const init = async () => {
      try {
        const { App } = await import('@capacitor/app')
        const { StatusBar, Style } = await import('@capacitor/status-bar')

        // Configurar status bar
        try {
          await StatusBar.setStyle({ style: Style.Dark })
          await StatusBar.setBackgroundColor({ color: '#FFFFFF' })
          await StatusBar.setOverlaysWebView({ overlay: false })
        } catch {
          /* algunos devices no soportan, ignorar */
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

        // Deep link handler global (confirmación de email, etc.)
        urlHandler = await App.addListener('appUrlOpen', async (event) => {
          const url = event.url ?? ''
          const isCallback =
            url.startsWith('airnation://auth/callback') ||
            /^https:\/\/(www\.)?airnation\.online\/auth\/callback/.test(url)
          if (!isCallback) return

          try {
            const urlObj = new URL(url)
            const code = urlObj.searchParams.get('code')
            if (!code) return

            const { supabase } = await import('@/lib/supabase')
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) {
              console.error('[deeplink] exchange error:', error.message)
              return
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: profile } = await supabase
                .from('users').select('alias').eq('id', user.id).single()
              window.location.href = !profile?.alias ? '/onboarding' : '/dashboard'
            } else {
              window.location.href = '/dashboard'
            }
          } catch (err) {
            console.error('[deeplink] error:', err)
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
