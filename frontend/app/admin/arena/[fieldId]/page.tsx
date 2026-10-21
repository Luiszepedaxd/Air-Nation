export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { ensureAppAdminOrRedirect } from '../../require-app-admin'
import { AdminArenaFieldClient } from './AdminArenaFieldClient'

export const metadata = { robots: { index: false, follow: false } }

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

type FieldRow = {
  id: string
  nombre: string | null
  slug: string | null
  ciudad: string | null
  status: string | null
  horarios_json: unknown
}

/** El encabezado lo sirve el backend (requireAdmin): sin llave de servicio aquí. */
async function fetchField(fieldId: string): Promise<FieldRow | null> {
  const {
    data: { session },
  } = await createDashboardSupabaseServerClient().auth.getSession()
  const token = session?.access_token
  if (!token) return null

  try {
    const res = await fetch(
      `${API_URL}/arena/admin/fields/${encodeURIComponent(fieldId)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (!res.ok) {
      if (res.status !== 404) console.error('[arena] admin/fields:', res.status)
      return null
    }
    const { field } = (await res.json()) as { field?: FieldRow }
    return field ?? null
  } catch (e) {
    console.error('[arena] admin/fields:', (e as Error).message)
    return null
  }
}

export default async function AdminArenaFieldPage({
  params,
}: {
  params: { fieldId: string }
}) {
  await ensureAppAdminOrRedirect(`/admin/arena/${params.fieldId}`)

  const field = await fetchField(params.fieldId)
  if (!field) notFound()

  return (
    <div className="p-6">
      <Link
        href="/admin/arena"
        className="text-[11px] uppercase tracking-[0.12em] text-[#666666] underline"
        style={{ fontFamily: "'Jost', sans-serif", fontWeight: 800 }}
      >
        ← Volver a ARENA
      </Link>
      <AdminArenaFieldClient
        field={{
          id: field.id,
          nombre: String(field.nombre ?? ''),
          slug: String(field.slug ?? ''),
          ciudad: field.ciudad ?? null,
          status: String(field.status ?? ''),
          horarios_json: field.horarios_json ?? null,
        }}
      />
    </div>
  )
}
