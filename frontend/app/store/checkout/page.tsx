import { getDatosBancarios } from './actions'
import { CheckoutClient } from './CheckoutClient'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const datosBancarios = await getDatosBancarios()

  const meta = (user?.user_metadata ?? {}) as { nombre?: string }

  return (
    <CheckoutClient
      user={
        user
          ? {
              id: user.id,
              email: user.email ?? '',
              nombre: meta.nombre ?? '',
            }
          : null
      }
      datosBancarios={datosBancarios}
    />
  )
}
