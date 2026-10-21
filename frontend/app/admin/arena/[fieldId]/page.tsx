export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '../../supabase-server'
import { ensureAppAdminOrRedirect } from '../../require-app-admin'
import { AdminArenaFieldClient } from './AdminArenaFieldClient'

export const metadata = { robots: { index: false, follow: false } }

export default async function AdminArenaFieldPage({
  params,
}: {
  params: { fieldId: string }
}) {
  await ensureAppAdminOrRedirect(`/admin/arena/${params.fieldId}`)

  const supabase = createAdminClient()
  const { data: field } = await supabase
    .from('fields')
    .select('id, nombre, slug, ciudad, status, horarios_json')
    .eq('id', params.fieldId)
    .maybeSingle()

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
          id: field.id as string,
          nombre: String(field.nombre ?? ''),
          slug: String(field.slug ?? ''),
          ciudad: (field.ciudad as string | null) ?? null,
          status: String(field.status ?? ''),
          horarios_json: field.horarios_json ?? null,
        }}
      />
    </div>
  )
}
