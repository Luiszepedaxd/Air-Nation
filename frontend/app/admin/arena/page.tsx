export const dynamic = 'force-dynamic'

import { ensureAppAdminOrRedirect } from '../require-app-admin'
import { AdminArenaClient } from './AdminArenaClient'

export const metadata = { robots: { index: false, follow: false } }

export default async function AdminArenaPage() {
  await ensureAppAdminOrRedirect('/admin/arena')
  return <AdminArenaClient />
}
