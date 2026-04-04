import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { EditTeamClient } from './EditTeamClient'

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  'https://placeholder.supabase.co'
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          /* Server Component: cookies() puede ser de solo lectura */
        }
      },
    },
  })
}

function isEditorRole(rol: string | null | undefined) {
  const r = (rol || '').toLowerCase().trim()
  return r === 'founder' || r === 'admin'
}

export default async function EditarEquipoPage({
  params,
}: {
  params: { slug: string }
}) {
  const slug = params.slug
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/equipos/${slug}/editar`)}`
    )
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select(
      'id, nombre, slug, ciudad, descripcion, historia, foto_portada_url, logo_url, instagram, facebook, whatsapp_url, created_at, status'
    )
    .eq('slug', slug)
    .maybeSingle()

  if (teamError || !team) {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  const row = team as { status?: string | null }
  if (row.status && row.status !== 'activo') {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  const { data: membership } = await supabase
    .from('team_members')
    .select('rol_plataforma')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .eq('status', 'activo')
    .maybeSingle()

  if (!membership || !isEditorRole(membership.rol_plataforma)) {
    redirect(`/equipos/${encodeURIComponent(slug)}`)
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <EditTeamClient
        teamId={team.id as string}
        team={{
          id: team.id as string,
          nombre: team.nombre as string,
          slug: team.slug as string,
          ciudad: team.ciudad as string | null,
          descripcion: team.descripcion as string | null,
          historia: team.historia as string | null,
          foto_portada_url: team.foto_portada_url as string | null,
          logo_url: team.logo_url as string | null,
          instagram: team.instagram as string | null,
          facebook: team.facebook as string | null,
          whatsapp_url: team.whatsapp_url as string | null,
        }}
        slug={slug}
      />
    </div>
  )
}
