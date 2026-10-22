export const dynamic = 'force-dynamic'

import { ensureAppAdminOrRedirect } from '../../require-app-admin'
import { AdminArenaLandingClient } from './AdminArenaLandingClient'

export const metadata = { robots: { index: false, follow: false } }

export default async function AdminArenaLandingPage() {
  await ensureAppAdminOrRedirect('/admin/arena/landing')
  return <AdminArenaLandingClient />
}
