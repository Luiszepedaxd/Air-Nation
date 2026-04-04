import type { SupabaseClient } from '@supabase/supabase-js'

export const PENDING_JOIN_UPDATED_EVENT = 'airnation:pending-join-updated'

export function notifyPendingJoinUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PENDING_JOIN_UPDATED_EVENT))
  }
}

export type JoinRequestRow = {
  id: string
  user_id: string
  mensaje: string | null
  created_at: string
  team_id: string
  team_nombre: string
  team_slug: string
  solicitante_nombre: string | null
  solicitante_alias: string | null
  solicitante_avatar: string | null
}

type RawJoinRow = {
  id: string
  user_id: string
  mensaje: string | null
  created_at: string
  team_id: string
  teams:
    | { nombre: string | null; slug: string | null }
    | { nombre: string | null; slug: string | null }[]
    | null
  users:
    | {
        nombre: string | null
        alias: string | null
        avatar_url: string | null
      }
    | {
        nombre: string | null
        alias: string | null
        avatar_url: string | null
      }[]
    | null
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export function mapJoinRequestRow(r: RawJoinRow): JoinRequestRow {
  const t = one(r.teams)
  const u = one(r.users)
  return {
    id: r.id,
    user_id: r.user_id,
    mensaje: r.mensaje,
    created_at: r.created_at,
    team_id: r.team_id,
    team_nombre: t?.nombre ?? '',
    team_slug: t?.slug ?? '',
    solicitante_nombre: u?.nombre ?? null,
    solicitante_alias: u?.alias ?? null,
    solicitante_avatar: u?.avatar_url ?? null,
  }
}

/** Equipos donde el usuario actual es founder o admin (activo). */
export async function fetchModeratorTeamIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .eq('status', 'activo')
    .in('rol_plataforma', ['founder', 'admin'])

  return Array.from(
    new Set((data ?? []).map((m) => m.team_id as string).filter(Boolean))
  )
}

export async function fetchPendingJoinRequestsForModerator(
  supabase: SupabaseClient,
  userId: string
): Promise<JoinRequestRow[]> {
  const teamIds = await fetchModeratorTeamIds(supabase, userId)
  if (teamIds.length === 0) return []

  const { data, error } = await supabase
    .from('team_join_requests')
    .select(
      `
      id,
      user_id,
      mensaje,
      created_at,
      team_id,
      teams ( nombre, slug ),
      users ( nombre, alias, avatar_url )
    `
    )
    .eq('status', 'pendiente')
    .in('team_id', teamIds)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return (data as RawJoinRow[]).map(mapJoinRequestRow)
}

export async function fetchPendingJoinRequestCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const teamIds = await fetchModeratorTeamIds(supabase, userId)
  if (teamIds.length === 0) return 0

  const { count, error } = await supabase
    .from('team_join_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pendiente')
    .in('team_id', teamIds)

  if (error) return 0
  return count ?? 0
}
