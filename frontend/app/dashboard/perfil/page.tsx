import { redirect } from 'next/navigation'
import { fetchPendingJoinRequestsForModerator } from '@/lib/pending-join-requests'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { type MisEventoRsvpItem } from './MisEventosRsvpSection'
import { type MisEquipoItem } from './MisEquiposSection'
import { PerfilTabsClient } from './PerfilTabsClient'

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: { tab?: string; campo_creado?: string }
}) {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const { data: row, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error || !row) redirect('/login')

  let teamNombre: string | null = null
  let teamSlug: string | null = null
  if (row.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('nombre, slug')
      .eq('id', row.team_id)
      .maybeSingle()
    teamNombre = team?.nombre ?? null
    teamSlug = (team?.slug as string | undefined) ?? null
  }

  const isAdmin = row.app_role === 'admin'

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id, rol_plataforma, rango_militar')
    .eq('user_id', authUser.id)
    .eq('status', 'activo')

  const teamIds = Array.from(
    new Set((memberships ?? []).map((m) => m.team_id as string))
  )

  let misEquipos: MisEquipoItem[] = []

  if (teamIds.length > 0) {
    const { data: teamsRows } = await supabase
      .from('teams')
      .select('id, nombre, slug, logo_url, ciudad, status')
      .in('id', teamIds)
      .eq('status', 'activo')

    const byId = new Map((teamsRows ?? []).map((t) => [t.id as string, t]))

    misEquipos = (memberships ?? [])
      .map((m) => {
        const tid = m.team_id as string
        const team = byId.get(tid)
        if (!team) return null
        return {
          id: team.id as string,
          nombre: team.nombre as string,
          slug: team.slug as string,
          logo_url: team.logo_url as string | null,
          ciudad: team.ciudad as string | null,
          rol_plataforma: m.rol_plataforma as string | null,
          rango_militar: m.rango_militar as string | null,
        }
      })
      .filter((x): x is MisEquipoItem => x != null)
  }

  const initialJoinRequests = await fetchPendingJoinRequestsForModerator(
    supabase,
    authUser.id
  )

  const { data: pendingJoinRows } = await supabase
    .from('team_join_requests')
    .select('id, teams ( nombre )')
    .eq('user_id', authUser.id)
    .eq('status', 'pendiente')

  const { data: misCamposRows } = await supabase
    .from('fields')
    .select(
      'id, nombre, slug, ciudad, tipo, foto_portada_url, status, destacado'
    )
    .eq('created_by', authUser.id)
    .order('created_at', { ascending: false })

  const misCampos = (misCamposRows ?? []).map((r) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    slug: r.slug as string,
    ciudad: (r.ciudad as string | null) ?? null,
    tipo: (r.tipo as string | null) ?? null,
    foto_portada_url: (r.foto_portada_url as string | null) ?? null,
    status: String(r.status ?? ''),
    destacado: Boolean(r.destacado),
  }))

  function normalizeFieldEmbed(raw: unknown): {
    nombre: string | null
    slug: string | null
  } {
    const o = Array.isArray(raw) ? raw[0] : raw
    if (!o || typeof o !== 'object') return { nombre: null, slug: null }
    const x = o as Record<string, unknown>
    return {
      nombre: typeof x.nombre === 'string' ? x.nombre : null,
      slug: typeof x.slug === 'string' ? x.slug : null,
    }
  }

  function mapEventRow(r: {
    id: string
    title: string
    fecha: string
    imagen_url: string | null
    fields: unknown
  }): MisEventoRsvpItem {
    const f = normalizeFieldEmbed(r.fields)
    return {
      id: r.id,
      title: r.title,
      fecha: r.fecha,
      imagen_url: r.imagen_url,
      field_nombre: f.nombre,
      field_slug: f.slug,
    }
  }

  let misEventosProximos: MisEventoRsvpItem[] = []
  let misEventosPasados: MisEventoRsvpItem[] = []
  const { data: rsvpIdRows } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('user_id', authUser.id)

  const rsvpEventIds = Array.from(
    new Set(
      (rsvpIdRows ?? [])
        .map((r) => r.event_id as string | undefined)
        .filter((id): id is string => Boolean(id))
    )
  )

  const nowIso = new Date().toISOString()

  if (rsvpEventIds.length > 0) {
    const { data: proxRows } = await supabase
      .from('events')
      .select('id, title, fecha, imagen_url, fields ( nombre, slug )')
      .in('id', rsvpEventIds)
      .eq('status', 'publicado')
      .eq('published', true)
      .gte('fecha', nowIso)
      .order('fecha', { ascending: true })

    misEventosProximos = (proxRows ?? []).map((row) =>
      mapEventRow(
        row as {
          id: string
          title: string
          fecha: string
          imagen_url: string | null
          fields: unknown
        }
      )
    )

    const { data: pastRows } = await supabase
      .from('events')
      .select('id, title, fecha, imagen_url, fields ( nombre, slug )')
      .in('id', rsvpEventIds)
      .eq('status', 'publicado')
      .eq('published', true)
      .lt('fecha', nowIso)
      .order('fecha', { ascending: false })
      .limit(10)

    misEventosPasados = (pastRows ?? []).map((row) =>
      mapEventRow(
        row as {
          id: string
          title: string
          fecha: string
          imagen_url: string | null
          fields: unknown
        }
      )
    )
  }

  const pendingJoinPending: { id: string; nombre: string }[] = []
  for (const r of pendingJoinRows ?? []) {
    const raw = r as {
      id?: string
      teams?: { nombre?: string } | { nombre?: string }[] | null
    }
    const t = raw.teams
    const n = Array.isArray(t) ? t[0] : t
    const name = n?.nombre?.trim()
    const rid = raw.id
    if (name && rid) pendingJoinPending.push({ id: rid, nombre: name })
  }

  return (
    <PerfilTabsClient
      user={row}
      teamNombre={teamNombre}
      teamSlug={teamSlug}
      misEquipos={misEquipos}
      misCampos={misCampos}
      misEventosProximos={misEventosProximos}
      misEventosPasados={misEventosPasados}
      initialJoinRequests={initialJoinRequests}
      isAdmin={isAdmin}
      pendingJoinPending={pendingJoinPending}
      initialTab={
        searchParams.tab === 'campos'
          ? 'campos'
          : searchParams.tab === 'eventos'
            ? 'eventos'
            : undefined
      }
      campoRegistradoNotice={searchParams.campo_creado === '1'}
    />
  )
}
