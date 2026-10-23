import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { CheckoutClient } from './CheckoutClient'

export const revalidate = 0
export const metadata = {
  title: 'Datos y pago — AirNation ARENA',
  robots: { index: false, follow: false },
}

export default async function ArenaCheckoutPage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let contacto: { nombre: string; email: string } | null = null
  if (user?.id) {
    const { data: perfil } = await supabase
      .from('users')
      .select('nombre, alias, email')
      .eq('id', user.id)
      .maybeSingle()
    contacto = {
      nombre: String(perfil?.nombre || perfil?.alias || '').trim(),
      email: String(perfil?.email || user.email || '').trim(),
    }
  }

  return <CheckoutClient contacto={contacto} />
}
