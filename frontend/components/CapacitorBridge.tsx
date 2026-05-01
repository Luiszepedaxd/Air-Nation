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

const ROOT_ROUTES = new Set(['/', '/welcome', '/dashboard', '/login', '/register'])

export default function CapacitorBridge() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isNativeApp()) return

    let backHandler: { remove: () => void } | null = null

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
      } catch (err) {
        console.warn('[CapacitorBridge] init error:', err)
      }
    }

    void init()

    return () => {
      backHandler?.remove()
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
