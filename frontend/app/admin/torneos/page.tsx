import { ensureAppAdminOrRedirect } from '../require-app-admin'
import { AdminTorneosClient } from './AdminTorneosClient'

export default async function AdminTorneosPage() {
  await ensureAppAdminOrRedirect('/admin/torneos')
  return <AdminTorneosClient />
}
