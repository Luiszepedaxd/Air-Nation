import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { EditCampoClient } from './EditCampoClient'

export const revalidate = 0

export default async function EditarCampoPage({
  params,
}: {
  params: { slug: string }
}) {
  const slug = params.slug
  const supabase = createDashboardSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/campos/${slug}/editar`)}`
    )
  }

  const { data: field, error: fieldError } = await supabase
    .from('fields')
    .select(
      'id, nombre, slug, descripcion, horarios, ubicacion_lat, ubicacion_lng, telefono, instagram, foto_portada_url, galeria_urls, team_id, created_by'
    )
    .eq('slug', slug)
    .maybeSingle()

  if (fieldError || !field) {
    redirect(`/campos/${encodeURIComponent(slug)}`)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = profile?.app_role === 'admin'
  const isOwner = field.created_by === user.id

  if (!isAdmin && !isOwner) {
    redirect(`/campos/${encodeURIComponent(slug)}`)
  }

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .eq('status', 'activo')
    .in('rol_plataforma', ['founder', 'admin'])

  const teamIds = Array.from(
    new Set((memberships ?? []).map((m) => m.team_id as string))
  )

  let teamsForSelect: { id: string; nombre: string }[] = []

  if (teamIds.length > 0) {
    const { data: teamsRows } = await supabase
      .from('teams')
      .select('id, nombre')
      .in('id', teamIds)
      .eq('status', 'activo')
      .order('nombre', { ascending: true })

    teamsForSelect = (teamsRows ?? []).map((t) => ({
      id: t.id as string,
      nombre: String(t.nombre ?? ''),
    }))
  }

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
      />
    </div>
  )
}
