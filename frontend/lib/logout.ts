import { supabase } from '@/lib/supabase'

/**
 * Cierra sesión de forma completa: primero del plugin de Google nativo
 * (para que el próximo login vuelva a mostrar el selector de cuentas),
 * luego de Supabase. Seguro de llamar en web — el plugin se ignora.
 */
export async function signOutEverywhere() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { SocialLogin } = await import('@capgo/capacitor-social-login')
      await SocialLogin.logout({ provider: 'google' })
    }
  } catch {
    // web, o plugin no disponible, o no había sesión de google: ignorar
  }
  await supabase.auth.signOut({ scope: 'local' })
}
