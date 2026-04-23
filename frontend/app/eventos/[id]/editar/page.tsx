import { notFound, redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { EditEventoClient, type EditarFieldOption } from './EditEventoClient'

export default async function EditarEventoPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id?.trim()
  if (!id) notFound()

  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/eventos/${id}/editar`)}`)

  const { data: row, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      descripcion,
      field_id,
      fecha,
      cupo,
      imagen_url,
      url_externa,
      tipo,
      status,
      organizador_id,
      fields ( nombre, ciudad )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !row) notFound()

  const { data: prof } = await supabase
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = (prof?.app_role as string | undefined) === 'admin'
  const orgId = row.organizador_id as string | null

  if (orgId !== user.id && !isAdmin) {
    redirect(`/eventos/${id}`)
  }

  const rawF = row.fields as unknown
  const f = Array.isArray(rawF) ? rawF[0] : rawF
  const fieldNombre =
    f && typeof f === 'object' && 'nombre' in f
      ? String((f as { nombre?: string }).nombre ?? '')
      : ''
  const fieldCiudad =
    f && typeof f === 'object' && 'ciudad' in f
      ? String((f as { ciudad?: string }).ciudad ?? '')
      : ''

  let fieldsOptions: EditarFieldOption[] = []
  if (isAdmin) {
    const { data: fieldRows } = await supabase
      .from('fields')
      .select('id, nombre, ciudad')
      .eq('status', 'aprobado')
      .order('nombre', { ascending: true })
    fieldsOptions = (fieldRows ?? []) as EditarFieldOption[]
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <EditEventoClient
        eventId={id}
        isAdmin={isAdmin}
        fieldsOptions={fieldsOptions}
        initial={{
          title: String(row.title ?? ''),
          descripcion: (row.descripcion as string | null) ?? null,
          imagen_url: (row.imagen_url as string | null) ?? null,
          url_externa: (row.url_externa as string | null) ?? null,
          cupo: Number(row.cupo ?? 0),
          tipo: (row.tipo as string | null) ?? null,
          field_id: (row.field_id as string | null) ?? null,
          fecha: String(row.fecha ?? ''),
          status: String(row.status ?? ''),
          field_nombre: fieldNombre || null,
          field_ciudad: fieldCiudad || null,
        }}
      />
    </div>
  )
}
