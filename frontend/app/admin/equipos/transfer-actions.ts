'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export async function transferTeamAction(
  teamId: string,
  newUserId: string
): Promise<{ success: true } | { error: string }> {
  const admin = await requireAppAdminUserId()
  if (!admin) {
    return { error: 'No autorizado.' }
  }

  const tid = teamId?.trim()
  const uid = newUserId?.trim()
  if (!tid || !uid) {
    return { error: 'Datos no válidos.' }
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { error: e1 } = await supabase
    .from('teams')
    .update({
      created_by: uid,
      transferred_to: uid,
      transferred_at: now,
    })
    .eq('id', tid)

  if (e1) {
    return { error: e1.message }
  }

  const { data: existing, error: eSel } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', tid)
    .eq('user_id', uid)
    .maybeSingle()

  if (eSel) {
    return { error: eSel.message }
  }

  if (existing?.id) {
    const { error: e2 } = await supabase
      .from('team_members')
      .update({ rol_plataforma: 'founder' })
      .eq('id', existing.id)
    if (e2) {
      return { error: e2.message }
    }
  } else {
    const { error: e3 } = await supabase.from('team_members').insert({
      team_id: tid,
      user_id: uid,
      rol_plataforma: 'founder',
      rango_militar: 'operador',
      status: 'activo',
    })
    if (e3) {
      return { error: e3.message }
    }
  }

  revalidatePath('/admin/equipos')
  revalidatePath('/equipos')
  return { success: true }
}
