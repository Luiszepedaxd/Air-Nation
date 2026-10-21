import { notFound } from 'next/navigation'
import PublicSiteHeader from '@/components/layout/PublicSiteHeader'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { aceptaReservas, fetchArenaFicha } from '@/lib/arena-public'
import { ReservarClient } from './ReservarClient'

export const revalidate = 0
export const metadata = {
  title: 'Reservar — AirNation ARENA',
  robots: { index: false, follow: false },
}

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { item?: string }
}) {
  const ficha = await fetchArenaFicha(params.slug)
  if (!aceptaReservas(ficha) || !ficha) notFound()

  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let contacto: { nombre: string; email: string; telefono: string } | null = null
  if (user?.id) {
    const { data: perfil } = await supabase
      .from('users')
      .select('nombre, alias, email')
      .eq('id', user.id)
      .maybeSingle()
    contacto = {
      nombre: String(perfil?.nombre || perfil?.alias || '').trim(),
      email: String(perfil?.email || user.email || '').trim(),
      // `users` no guarda teléfono: el jugador lo escribe en el paso 3.
      telefono: '',
    }
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PublicSiteHeader />
      <ReservarClient
        slug={params.slug}
        ficha={ficha}
        contacto={contacto}
        itemPreseleccionado={searchParams.item ?? null}
      />
    </div>
  )
}
