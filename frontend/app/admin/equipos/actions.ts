'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'

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
