'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export async function deleteTeam(
  id: string
): Promise<{ success: true } | { error: string }> {
  const trimmed = id?.trim() ?? ''
  if (!trimmed) {
    return { error: 'ID no válido' }
  }

  const supabase = createAdminClient()

  const childTables = [
    'team_join_requests',
    'team_members',
    'team_posts',
    'team_albums',
  ] as const

  for (const table of childTables) {
    const { error } = await supabase.from(table).delete().eq('team_id', trimmed)
    if (error) {
      return { error: error.message }
    }
  }

  const { error: clearUsersErr } = await supabase
    .from('users')
    .update({ team_id: null })
    .eq('team_id', trimmed)

  if (clearUsersErr) {
    return { error: clearUsersErr.message }
  }

  const { error } = await supabase.from('teams').delete().eq('id', trimmed)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/equipos')
  revalidatePath('/equipos')
  return { success: true as const }
}

export type UpdateTeamAdminPayload = {
  teamId: string
  nombre: string
  ciudad: string | null
  estado?: string | null
  descripcion: string | null
  historia: string | null
  instagram: string | null
  facebook: string | null
  whatsapp_url: string | null
  foto_portada_url: string | null
  logo_url: string | null
}

export async function updateTeamAdmin(
  payload: UpdateTeamAdminPayload
): Promise<{ success: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) {
    return { error: 'No autorizado.' }
  }

  const teamId = payload.teamId?.trim()
  if (!teamId) {
    return { error: 'Equipo no válido.' }
  }

  const n = payload.nombre.trim()
  if (n.length < 2) {
    return { error: 'El nombre debe tener al menos 2 caracteres.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('teams')
    .update({
      nombre: n,
      ciudad: payload.ciudad?.trim() || null,
      estado: payload.estado?.trim() || null,
      descripcion: payload.descripcion?.trim() || null,
      historia: payload.historia?.trim() || null,
      instagram: payload.instagram?.trim() || null,
      facebook: payload.facebook?.trim() || null,
      whatsapp_url: payload.whatsapp_url?.trim() || null,
      foto_portada_url: payload.foto_portada_url?.trim() || null,
      logo_url: payload.logo_url?.trim() || null,
    })
    .eq('id', teamId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/equipos')
  return { success: true }
}

export async function toggleTeamDestacado(
  id: string,
  destacado: boolean
): Promise<{ success: true } | { error: string }> {
  const trimmedId = id?.trim() ?? ''
  if (!trimmedId) {
    return { error: 'ID no válido' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('teams')
    .update({ destacado })
    .eq('id', trimmedId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/equipos')
  revalidatePath('/equipos')
  revalidatePath('/dashboard')
  return { success: true as const }
}
