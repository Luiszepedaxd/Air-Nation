import { TeamForm } from '@/app/equipos/nuevo/TeamForm'
import { ensureAppAdminOrRedirect } from '../../require-app-admin'

export default async function AdminNuevoEquipoPage() {
  await ensureAppAdminOrRedirect('/admin/equipos/nuevo')

  return (
    <div className="p-6">
      <TeamForm adminContext />
    </div>
  )
}
