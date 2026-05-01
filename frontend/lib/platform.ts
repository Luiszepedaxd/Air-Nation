/**
 * Detección de plataforma de ejecución.
 *
 * Distingue entre:
 *  - app nativa Capacitor (iOS y Android)
 *  - web mobile (Chrome/Safari en celular)
 *  - web desktop
 *
 * Todas las funciones son SSR-safe: retornan false en server.
 * Uso: condicionar UI según entorno (ej. ocultar feedback banner en app nativa).
 */

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean
    getPlatform?: () => 'ios' | 'android' | 'web'
  }
}

/** True si el código corre dentro de la app nativa Capacitor (iOS o Android). */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as CapacitorWindow
  return Boolean(w.Capacitor?.isNativePlatform?.())
}

/** Plataforma reportada por Capacitor: 'ios' | 'android' | 'web'. */
export function getNativePlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web'
  const w = window as CapacitorWindow
  return w.Capacitor?.getPlatform?.() ?? 'web'
}

/** True si el UA es un dispositivo iOS (iPhone, iPad, iPod), incluye web e in-app. */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
}

/** True si el UA es un dispositivo Android, incluye web e in-app. */
export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/** True solo cuando la app corre en navegador (no Capacitor) en un Android. */
export function isAndroidWeb(): boolean {
  return !isNativeApp() && isAndroidDevice()
}

/** True solo cuando la app corre en navegador (no Capacitor) en un iOS. */
export function isIOSWeb(): boolean {
  return !isNativeApp() && isIOSDevice()
}

/** True si es viewport mobile (ancho < 768) o UA mobile. */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  if (window.innerWidth < 768) return true
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}
