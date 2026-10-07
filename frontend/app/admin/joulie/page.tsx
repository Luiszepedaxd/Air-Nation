export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requireAppAdminUserId } from '../require-app-admin'
import { getJoulieEnabled } from './actions'
import { JoulieAdminClient } from './JoulieAdminClient'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminJouliePage() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const { enabled, ready } = await getJoulieEnabled()

  return (
    <div className="p-6">
      <div className="mb-6 border-b border-solid border-[#EEEEEE] pb-4">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          JOULIE
        </h1>
        <p className="mt-2 text-[12px] text-[#999999]" style={{ fontFamily: "'Lato', sans-serif" }}>
          Asistente de voz de AirNation. Solo un administrador puede prenderla o apagarla.
        </p>
      </div>
      <JoulieAdminClient initialEnabled={enabled} ready={ready} />
    </div>
  )
}
