import { ensureAppAdminOrRedirect } from '../../require-app-admin'
import { AdminTorneoDetail } from './AdminTorneoDetail'

export default async function AdminTorneoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await ensureAppAdminOrRedirect(`/admin/torneos/${params.id}`)
  return <AdminTorneoDetail tournamentId={params.id} />
}
