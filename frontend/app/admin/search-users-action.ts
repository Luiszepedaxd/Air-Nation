'use server'

import { createAdminClient } from './supabase-server'
import { requireAppAdminUserId } from './require-app-admin'

export type UserSearchRow = {
  id: string
  nombre: string | null
  alias: string | null
  email: string | null
  avatar_url: string | null
}

export async function searchUsersAction(
  query: string
): Promise<{ users: UserSearchRow[] } | { error: string }> {
  const ok = await requireAppAdminUserId()
  if (!ok) {
    return { error: 'No autorizado.' }
  }

  const raw = query.replace(/[%_,]/g, '').trim()
  if (raw.length < 2) {
    return { users: [] }
  }

  const term = `%${raw}%`
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, nombre, alias, email, avatar_url')
    .or(`alias.ilike.${term},email.ilike.${term}`)
    .limit(20)

  if (error) {
    return { error: error.message }
  }

  return { users: (data ?? []) as UserSearchRow[] }
}
