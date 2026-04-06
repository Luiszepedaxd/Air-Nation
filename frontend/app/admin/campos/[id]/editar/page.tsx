import { redirect } from 'next/navigation'
import { EditCampoClient } from '@/app/campos/[slug]/editar/EditCampoClient'
import { createAdminClient } from '../../../supabase-server'
import { ensureAppAdminOrRedirect } from '../../../require-app-admin'

export const revalidate = 0

export default async function AdminEditarCampoPage({
  params,
}: {
  params: { id: string }
}) {
  await ensureAppAdminOrRedirect(`/admin/campos/${params.id}/editar`)

  const supabase = createAdminClient()
  const { data: field, error: fieldError } = await supabase
    .from('fields')
    .select(
      'id, nombre, slug, descripcion, horarios, ubicacion_lat, ubicacion_lng, telefono, instagram, foto_portada_url, galeria_urls, team_id'
    )
    .eq('id', params.id)
    .maybeSingle()

  if (fieldError || !field || !field.slug) {
    redirect('/admin/campos')
  }

  const slug = field.slug as string

  const { data: teamsRows } = await supabase
    .from('teams')
    .select('id, nombre')
    .eq('status', 'activo')
    .order('nombre', { ascending: true })

  const teamsForSelect = (teamsRows ?? []).map((t) => ({
    id: t.id as string,
    nombre: String(t.nombre ?? ''),
  }))

  const rawGaleria = field.galeria_urls
  const galeria_urls = Array.isArray(rawGaleria)
    ? rawGaleria.filter((x): x is string => typeof x === 'string')
    : []

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <EditCampoClient
        fieldId={field.id as string}
        publicSlug={slug}
        field={{
          id: field.id as string,
          nombre: field.nombre as string,
          descripcion: (field.descripcion as string | null) ?? null,
          horarios: field.horarios,
          ubicacion_lat: field.ubicacion_lat,
          ubicacion_lng: field.ubicacion_lng,
          telefono: (field.telefono as string | null) ?? null,
          instagram: (field.instagram as string | null) ?? null,
          foto_portada_url: (field.foto_portada_url as string | null) ?? null,
          galeria_urls,
          team_id: (field.team_id as string | null) ?? null,
        }}
        teamsForSelect={teamsForSelect}
        adminReturnPath="/admin/campos"
      />
    </div>
  )
}
