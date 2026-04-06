'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export type TeamSearchRow = {
  id: string
  nombre: string
  ciudad: string | null
}

export type UserMembershipRow = {
  memberId: string
  teamId: string
  nombre: string
  ciudad: string | null
}

export async function searchTeamsAdminAction(
  q: string
): Promise<{ teams: TeamSearchRow[] } | { error: string }> {
  const ok = await requireAppAdminUserId()
  if (!ok) return { error: 'No autorizado.' }

  const raw = q.replace(/[%_,]/g, '').trim()
  if (raw.length < 2) {
    return { teams: [] }
  }

  const term = `%${raw}%`
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('teams')
    .select('id, nombre, ciudad')
    .ilike('nombre', term)
    .order('nombre', { ascending: true })
    .limit(20)

  if (error) {
    return { error: error.message }
  }

  return {
    teams: (data ?? []).map((t) => ({
      id: t.id as string,
      nombre: String(t.nombre ?? ''),
      ciudad: (t.ciudad as string | null) ?? null,
    })),
  }
}

export async function getUserTeamMembershipsAction(
  userId: string
): Promise<{ memberships: UserMembershipRow[] } | { error: string }> {
  const ok = await requireAppAdminUserId()
  if (!ok) return { error: 'No autorizado.' }

  const uid = userId?.trim()
  if (!uid) return { error: 'Usuario no válido.' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('team_members')
    .select(
      `
      id,
      team_id,
      status,
      teams ( nombre, ciudad )
    `
    )
    .eq('user_id', uid)
    .eq('status', 'activo')

  if (error) {
    return { error: error.message }
  }

  const rows = data as {
    id: string
    team_id: string
    teams: unknown
  }[]

  const memberships: UserMembershipRow[] = []
  for (const row of rows) {
    const t = Array.isArray(row.teams) ? row.teams[0] : row.teams
    const to = t as { nombre?: string | null; ciudad?: string | null } | null
    memberships.push({
      memberId: row.id,
      teamId: row.team_id,
      nombre: to?.nombre?.trim() || '—',
      ciudad: to?.ciudad ?? null,
    })
  }

  return { memberships }
}

export async function assignUserToTeamAction(
  userId: string,
  teamId: string
): Promise<{ success: true } | { error: string }> {
  const ok = await requireAppAdminUserId()
  if (!ok) return { error: 'No autorizado.' }

  const uid = userId?.trim()
  const tid = teamId?.trim()
  if (!uid || !tid) {
    return { error: 'Datos no válidos.' }
  }

  const supabase = createAdminClient()

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', tid)
    .maybeSingle()

  if (!team) {
    return { error: 'Equipo no encontrado.' }
  }

  const { data: existing } = await supabase
    .from('team_members')
    .select('id, status')
    .eq('team_id', tid)
    .eq('user_id', uid)
    .maybeSingle()

  if (existing?.id) {
    if ((existing as { status?: string }).status !== 'activo') {
      const { error: upErr } = await supabase
        .from('team_members')
        .update({ status: 'activo' })
        .eq('id', existing.id)
      if (upErr) return { error: upErr.message }
    }
  } else {
    const { error: insErr } = await supabase.from('team_members').insert({
      team_id: tid,
      user_id: uid,
      rol_plataforma: 'member',
      rango_militar: 'miembro',
      status: 'activo',
    })
    if (insErr) return { error: insErr.message }
  }

  const { error: userErr } = await supabase
    .from('users')
    .update({ team_id: tid })
    .eq('id', uid)

  if (userErr) {
    return { error: userErr.message }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function removeUserFromTeamAction(
  userId: string,
  teamId: string
): Promise<{ success: true } | { error: string }> {
  const ok = await requireAppAdminUserId()
  if (!ok) return { error: 'No autorizado.' }

  const uid = userId?.trim()
  const tid = teamId?.trim()
  if (!uid || !tid) {
    return { error: 'Datos no válidos.' }
  }

  const supabase = createAdminClient()

  const { error: tmErr } = await supabase
    .from('team_members')
    .update({ status: 'inactivo' })
    .eq('team_id', tid)
    .eq('user_id', uid)

  if (tmErr) {
    return { error: tmErr.message }
  }

  const { data: urow } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', uid)
    .maybeSingle()

  if ((urow as { team_id?: string | null } | null)?.team_id === tid) {
    const { error: uErr } = await supabase
      .from('users')
      .update({ team_id: null })
      .eq('id', uid)
    if (uErr) {
      return { error: uErr.message }
    }
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}
