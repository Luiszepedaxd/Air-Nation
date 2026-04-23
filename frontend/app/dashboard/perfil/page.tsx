import { redirect } from 'next/navigation'
import type { ApprovedFieldNotice } from '@/lib/approved-field-notices'
import type { PendingFieldOwnerRequest } from '@/lib/pending-field-owner-requests'
import { fetchPendingJoinRequestsForModerator } from '@/lib/pending-join-requests'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { type MisEventoRsvpItem } from './MisEventosRsvpSection'
import type { PlayerPostRow, PublicReplicaRow } from '@/app/u/[id]/types'
import { type MisEquipoItem } from './MisEquiposSection'
import type { CredentialUserData } from '@/components/credential/CredentialCard'
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

  // ── Block 1: user row (needed for team_id, isAdmin, props) ────────────
  const { data: row, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error || !row) redirect('/login')

  const isAdmin = row.app_role === 'admin'

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoIso = weekAgo.toISOString()

  // ── Block 2: parallel (all depend only on authUser.id / row) ──────────
  const [
    teamResult,
    membershipsResult,
    initialJoinRequests,
    approvedFieldResult,
    pendingJoinRowsResult,
    misCamposResult,
    rsvpResult,
    userWithTeamResult,
    postsResult,
    replicasResult,
  ] = await Promise.all([
    row.team_id
      ? supabase
          .from('teams')
          .select('nombre, slug')
          .eq('id', row.team_id)
          .maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
    supabase
      .from('team_members')
      .select('team_id, rol_plataforma, rango_militar')
      .eq('user_id', authUser.id)
      .eq('status', 'activo'),
    fetchPendingJoinRequestsForModerator(supabase, authUser.id),
    supabase
      .from('field_requests')
      .select(
        `
      id,
      fecha_deseada,
      created_at,
      updated_at,
      approved_event_id,
      fields ( nombre, slug )
    `
      )
      .eq('solicitante_id', authUser.id)
      .eq('status', 'aprobado')
      .gte('updated_at', weekAgoIso)
      .not('approved_event_id', 'is', null)
      .order('updated_at', { ascending: false }),
    supabase
      .from('team_join_requests')
      .select('id, teams ( nombre )')
      .eq('user_id', authUser.id)
      .eq('status', 'pendiente'),
    supabase
      .from('fields')
      .select(
        'id, nombre, slug, ciudad, tipo, foto_portada_url, status, destacado'
      )
      .eq('created_by', authUser.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', authUser.id),
    supabase
      .from('users')
      .select('teams(nombre)')
      .eq('id', authUser.id)
      .maybeSingle(),
    supabase
      .from('player_posts')
      .select('id, content, fotos_urls, video_url, video_mp4_url, video_duration_s, created_at')
      .eq('user_id', authUser.id)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('arsenal')
      .select(
        'id, nombre, sistema, mecanismo, condicion, foto_url, verificada, ciudad, estado'
      )
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false }),
  ])

  // ── Extract & derive from Block 2 ────────────────────────────────────
  const teamNombre = teamResult.data?.nombre ?? null
  const teamSlug = (teamResult.data?.slug as string | undefined) ?? null

  const memberships = membershipsResult.data
  const teamIds = Array.from(
    new Set((memberships ?? []).map((m) => m.team_id as string))
  )

  if (approvedFieldResult.error) {
    console.error(
      '[perfil] approved field notices:',
      approvedFieldResult.error.message
    )
  }

  const approvedFieldNotices: ApprovedFieldNotice[] = []
  for (const r of approvedFieldResult.data ?? []) {
    const raw = r as {
      id?: string
      fecha_deseada?: string | null
      created_at?: string
      updated_at?: string
      approved_event_id?: string | null
      fields?:
        | { nombre?: string; slug?: string }
        | { nombre?: string; slug?: string }[]
        | null
    }
    const eid = raw.approved_event_id
    const rid = raw.id
    if (!eid || !rid) continue
    const f = Array.isArray(raw.fields) ? raw.fields[0] : raw.fields
    approvedFieldNotices.push({
      id: rid,
      fecha_deseada: raw.fecha_deseada ?? null,
      created_at: String(raw.created_at ?? ''),
      updated_at: String(raw.updated_at ?? raw.created_at ?? ''),
      field_nombre: f?.nombre?.trim() || 'Campo',
      field_slug: f?.slug?.trim() || '',
      event_id: eid,
    })
  }

  const pendingJoinRows = pendingJoinRowsResult.data

  const misCampos = (misCamposResult.data ?? []).map((r) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    slug: r.slug as string,
    ciudad: (r.ciudad as string | null) ?? null,
    tipo: (r.tipo as string | null) ?? null,
    foto_portada_url: (r.foto_portada_url as string | null) ?? null,
    status: String(r.status ?? ''),
    destacado: Boolean(r.destacado),
  }))
  const ownedFieldIds = misCampos.map((c) => c.id)

  const rsvpEventIds = Array.from(
    new Set(
      (rsvpResult.data ?? [])
        .map((r) => r.event_id as string | undefined)
        .filter((id): id is string => Boolean(id))
    )
  )

  let credencialTeamNombre: string | null = null
  const teamsEmbed = (userWithTeamResult.data as { teams?: unknown } | null)
    ?.teams
  if (teamsEmbed) {
    credencialTeamNombre = Array.isArray(teamsEmbed)
      ? (teamsEmbed[0] as { nombre?: string } | undefined)?.nombre ?? null
      : (teamsEmbed as { nombre?: string }).nombre ?? null
  }

  const postsData = postsResult.data
  const replicasData = replicasResult.data

  const nowIso = new Date().toISOString()

  // ── Block 3: parallel (depend on Block 2 results) ─────────────────────
  const [
    teamsRowsResult,
    frOwnerPendingResult,
    proxRowsResult,
    pastRowsResult,
  ] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from('teams')
          .select('id, nombre, slug, logo_url, ciudad, status')
          .in('id', teamIds)
          .eq('status', 'activo')
      : Promise.resolve({ data: null } as { data: null }),
    ownedFieldIds.length > 0
      ? supabase
          .from('field_requests')
          .select(
            `
        id,
        field_id,
        fecha_deseada,
        num_jugadores,
        created_at,
        fields ( nombre ),
        users ( nombre, alias )
      `
          )
          .in('field_id', ownedFieldIds)
          .eq('status', 'pendiente')
          .order('created_at', { ascending: false })
      : Promise.resolve({
          data: null,
          error: null,
        } as { data: null; error: null }),
    rsvpEventIds.length > 0
      ? supabase
          .from('events')
          .select(
            'id, title, fecha, imagen_url, organizador_id, fields ( nombre, slug, foto_portada_url )'
          )
          .in('id', rsvpEventIds)
          .eq('status', 'publicado')
          .eq('published', true)
          .gte('fecha', nowIso)
          .order('fecha', { ascending: true })
      : Promise.resolve({ data: null } as { data: null }),
    rsvpEventIds.length > 0
      ? supabase
          .from('events')
          .select(
            'id, title, fecha, imagen_url, organizador_id, fields ( nombre, slug, foto_portada_url )'
          )
          .in('id', rsvpEventIds)
          .eq('status', 'publicado')
          .eq('published', true)
          .lt('fecha', nowIso)
          .order('fecha', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: null } as { data: null }),
  ])

  // ── Process Block 3 results ───────────────────────────────────────────

  let misEquipos: MisEquipoItem[] = []
  if (teamIds.length > 0 && teamsRowsResult.data) {
    const byId = new Map(
      (teamsRowsResult.data ?? []).map((t) => [t.id as string, t])
    )
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

  const ownerPendingFieldRequests: PendingFieldOwnerRequest[] = []
  if (ownedFieldIds.length > 0) {
    if (frOwnerPendingResult.error) {
      console.error(
        '[perfil] owner pending field requests:',
        frOwnerPendingResult.error.message
      )
    }
    for (const raw of frOwnerPendingResult.data ?? []) {
      const r = raw as {
        id?: string
        field_id?: string
        fecha_deseada?: string | null
        num_jugadores?: number | null
        created_at?: string
        fields?: { nombre?: string } | { nombre?: string }[] | null
        users?: { nombre?: string; alias?: string } | null | unknown[]
      }
      const rid = r.id
      const fid = r.field_id
      if (!rid || !fid) continue
      const f = Array.isArray(r.fields) ? r.fields[0] : r.fields
      const u = Array.isArray(r.users) ? r.users[0] : r.users
      const uo =
        u && typeof u === 'object'
          ? (u as { nombre?: string | null; alias?: string | null })
          : null
      ownerPendingFieldRequests.push({
        id: rid,
        field_id: fid,
        fecha_deseada: r.fecha_deseada ?? null,
        num_jugadores:
          typeof r.num_jugadores === 'number' ? r.num_jugadores : null,
        created_at: String(r.created_at ?? ''),
        field_nombre: f?.nombre?.trim() || 'Campo',
        solicitante_nombre: uo?.nombre ?? null,
        solicitante_alias: uo?.alias ?? null,
      })
    }
  }

  function normalizeFieldEmbed(raw: unknown): {
    nombre: string | null
    slug: string | null
    foto_portada_url: string | null
  } {
    const o = Array.isArray(raw) ? raw[0] : raw
    if (!o || typeof o !== 'object') {
      return { nombre: null, slug: null, foto_portada_url: null }
    }
    const x = o as Record<string, unknown>
    return {
      nombre: typeof x.nombre === 'string' ? x.nombre : null,
      slug: typeof x.slug === 'string' ? x.slug : null,
      foto_portada_url:
        typeof x.foto_portada_url === 'string' ? x.foto_portada_url : null,
    }
  }

  function mapEventRow(r: {
    id: string
    title: string
    fecha: string
    imagen_url: string | null
    organizador_id: string | null
    fields: unknown
  }): MisEventoRsvpItem {
    const f = normalizeFieldEmbed(r.fields)
    return {
      id: r.id,
      title: r.title,
      fecha: r.fecha,
      imagen_url: r.imagen_url,
      field_foto: f.foto_portada_url,
      field_nombre: f.nombre,
      field_slug: f.slug,
      organizador_id: r.organizador_id,
    }
  }

  type EventRowShape = {
    id: string
    title: string
    fecha: string
    imagen_url: string | null
    organizador_id: string | null
    fields: unknown
  }

  const misEventosProximos = (proxRowsResult.data ?? []).map((row) =>
    mapEventRow(row as EventRowShape)
  )
  const misEventosPasados = (pastRowsResult.data ?? []).map((row) =>
    mapEventRow(row as EventRowShape)
  )

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

  const credencialData: CredentialUserData = {
    id: row.id as string,
    nombre: row.nombre ?? null,
    alias: row.alias ?? null,
    ciudad: row.ciudad ?? null,
    rol: row.rol ?? null,
    avatar_url: row.avatar_url ?? null,
    member_number: row.member_number ?? null,
    created_at: String(row.created_at ?? ''),
    teamNombre: credencialTeamNombre,
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
      approvedFieldNotices={approvedFieldNotices}
      ownerPendingFieldRequests={ownerPendingFieldRequests}
      isAdmin={isAdmin}
      pendingJoinPending={pendingJoinPending}
      initialTab={undefined}
      campoRegistradoNotice={searchParams.campo_creado === '1'}
      credencialData={credencialData}
      posts={(postsData ?? []) as PlayerPostRow[]}
      replicas={(replicasData ?? []) as PublicReplicaRow[]}
    />
  )
}
