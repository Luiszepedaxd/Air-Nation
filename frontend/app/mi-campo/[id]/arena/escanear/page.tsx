import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { puedeOperarCampo } from '@/lib/arena-members'
import { EscanearClient } from './EscanearClient'

export const revalidate = 0
export const metadata = { robots: { index: false, follow: false } }

export default async function EscanearPage({ params }: { params: { id: string } }) {
  const id = params.id?.trim()
  if (!id) redirect('/dashboard/perfil')

  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/mi-campo/${id}/arena/escanear`)}`)

  const [{ data: field }, { data: perfil }] = await Promise.all([
    supabase.from('fields').select('id, nombre, created_by').eq('id', id).maybeSingle(),
    supabase.from('users').select('app_role').eq('id', user.id).maybeSingle(),
  ])
  if (!field) redirect('/dashboard/perfil')

  const autorizado = await puedeOperarCampo(
    id,
    user.id,
    field.created_by as string | null,
    perfil?.app_role as string | null
  )
  if (!autorizado) redirect('/dashboard/perfil')

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <EscanearClient fieldId={id} nombre={String(field.nombre ?? '')} />
    </div>
  )
}
