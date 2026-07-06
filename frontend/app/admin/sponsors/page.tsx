export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requireAppAdminUserId } from '../require-app-admin'
import { getSponsors } from './actions'
import { SponsorsAdminClient } from './SponsorsAdminClient'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminSponsorsPage() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const sponsors = await getSponsors()

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-solid border-[#EEEEEE] pb-4">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          CATÁLOGO DE SPONSORS
        </h1>
        <p className="mt-2 text-[12px] text-[#999999]" style={{ fontFamily: "'Lato', sans-serif" }}>
          Patrocinadores reutilizables en las landings de eventos.
        </p>
      </div>

      <SponsorsAdminClient initialSponsors={sponsors} />
    </div>
  )
}
