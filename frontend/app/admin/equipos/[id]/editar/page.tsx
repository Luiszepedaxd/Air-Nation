import { redirect } from 'next/navigation'
import { EditTeamClient } from '@/app/equipos/[slug]/editar/EditTeamClient'
import { createAdminClient } from '../../../supabase-server'
import { ensureAppAdminOrRedirect } from '../../../require-app-admin'

export default async function AdminEditarEquipoPage({
  params,
}: {
  params: { id: string }
}) {
  await ensureAppAdminOrRedirect(`/admin/equipos/${params.id}/editar`)

  const supabase = createAdminClient()
  const { data: team, error } = await supabase
    .from('teams')
    .select(
      'id, nombre, slug, ciudad, estado, descripcion, historia, foto_portada_url, logo_url, instagram, facebook, whatsapp_url, status'
    )
    .eq('id', params.id)
    .maybeSingle()

  if (error || !team || !team.slug) {
    redirect('/admin/equipos')
  }

  const slug = team.slug as string

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <EditTeamClient
        teamId={team.id as string}
        team={{
          id: team.id as string,
          nombre: team.nombre as string,
          slug,
          ciudad: team.ciudad as string | null,
          estado: team.estado as string | null,
          descripcion: team.descripcion as string | null,
          historia: team.historia as string | null,
          foto_portada_url: team.foto_portada_url as string | null,
          logo_url: team.logo_url as string | null,
          instagram: team.instagram as string | null,
          facebook: team.facebook as string | null,
          whatsapp_url: team.whatsapp_url as string | null,
        }}
        slug={slug}
        adminReturnPath="/admin/equipos"
      />
    </div>
  )
}
