import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { AdminClient } from './AdminClient'
import type { TeamAlbumAdminRow } from './types'

function isModeratorRole(rol: string | null | undefined) {
  const r = (rol || '').toLowerCase().trim()
  return r === 'founder' || r === 'admin'
}

export default async function EquipoAdminPage({
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
    redirect(`/login?redirect=${encodeURIComponent(`/equipos/${slug}/admin`)}`)
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id, nombre, slug, ciudad, logo_url, status')
    .eq('slug', slug)
    .maybeSingle()

  if (teamError || !team) {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  const row = team as { status?: string | null }
  if (row.status && row.status !== 'activo') {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  const teamId = team.id as string

  const { data: membership } = await supabase
    .from('team_members')
    .select('rol_plataforma')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .eq('status', 'activo')
    .maybeSingle()

  if (!membership || !isModeratorRole(membership.rol_plataforma as string)) {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  const viewerRol = (membership.rol_plataforma as string | null) ?? ''

  const { data: rawAlbums, error: albumsErr } = await supabase
    .from('team_albums')
    .select('id, nombre, fotos_urls, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  const initialAlbums: TeamAlbumAdminRow[] =
    albumsErr || !rawAlbums
      ? []
      : (rawAlbums as TeamAlbumAdminRow[]).map((r) => ({
          id: r.id,
          nombre: r.nombre,
          fotos_urls: Array.isArray(r.fotos_urls)
            ? r.fotos_urls.filter(
                (u): u is string => typeof u === 'string' && u.trim().length > 0
              )
            : null,
          created_at: r.created_at,
        }))

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <AdminClient
        slug={slug}
        teamId={teamId}
        teamNombre={team.nombre as string}
        teamCiudad={(team.ciudad as string | null) ?? null}
        logoUrl={(team.logo_url as string | null) ?? null}
        viewerUserId={user.id}
        viewerRol={viewerRol}
        initialAlbums={initialAlbums}
      />
    </div>
  )
}
