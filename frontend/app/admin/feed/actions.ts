'use server'

import { revalidatePath } from 'next/cache'
import {
  createAdminClient,
  createAdminSupabaseServerClient,
} from '../supabase-server'

async function assertAdmin(): Promise<{ ok: true; userId: string } | { error: string }> {
  const userClient = createAdminSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: me } = await userClient
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  if (!me || (me as { app_role: string }).app_role !== 'admin') {
    return { error: 'No autorizado' }
  }
  return { ok: true, userId: user.id }
}

export async function adminDeletePlayerPost(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return auth
  if (!id) return { error: 'ID inválido' }

  const admin = createAdminClient()
  const { error } = await admin.from('player_posts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function adminDeleteTeamPost(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return auth
  if (!id) return { error: 'ID inválido' }

  const admin = createAdminClient()
  const { error } = await admin.from('team_posts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function adminDeleteFieldPost(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return auth
  if (!id) return { error: 'ID inválido' }

  const admin = createAdminClient()
  const { error } = await admin.from('field_posts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { ok: true }
}
