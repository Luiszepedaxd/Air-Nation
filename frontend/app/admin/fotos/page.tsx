import type { Metadata } from 'next'
import { ensureAppAdminOrRedirect } from '../require-app-admin'
import { GenerarFotosClient } from './GenerarFotosClient'

export const metadata: Metadata = {
  title: 'Generar fotos · Admin AirNation',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function GenerarFotosPage() {
  await ensureAppAdminOrRedirect('/admin/fotos')
  return <GenerarFotosClient />
}
