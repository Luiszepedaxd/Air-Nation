export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ensureAppAdminOrRedirect } from '../../require-app-admin'
import { AdminArenaReservasClient } from './AdminArenaReservasClient'

export const metadata = { robots: { index: false, follow: false } }

export default async function AdminArenaReservasPage() {
  await ensureAppAdminOrRedirect('/admin/arena/reservas')
  return (
    <div className="p-6">
      <Link
        href="/admin/arena"
        className="text-[11px] uppercase tracking-[0.12em] text-[#666666] underline"
        style={{ fontFamily: "'Jost', sans-serif", fontWeight: 800 }}
      >
        ← Volver a ARENA
      </Link>
      <AdminArenaReservasClient />
    </div>
  )
}
