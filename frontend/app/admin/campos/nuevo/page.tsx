import { CampoForm } from '@/app/campos/nuevo/CampoForm'
import { createAdminClient } from '../../supabase-server'
import { ensureAppAdminOrRedirect } from '../../require-app-admin'

export const revalidate = 0

export default async function AdminNuevoCampoPage() {
  await ensureAppAdminOrRedirect('/admin/campos/nuevo')

  const supabase = createAdminClient()
  const { data: teamsRows } = await supabase
    .from('teams')
    .select('id, nombre')
    .eq('status', 'activo')
    .order('nombre', { ascending: true })

  const teamsForSelect = (teamsRows ?? []).map((t) => ({
    id: t.id as string,
    nombre: String(t.nombre ?? ''),
  }))

  return (
    <div className="p-6">
      <CampoForm teamsForSelect={teamsForSelect} adminContext />
    </div>
  )
}
