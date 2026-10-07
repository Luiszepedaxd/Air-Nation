'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'

async function assertAdmin(): Promise<{ ok: true } | { error: string }> {
  const userClient = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: me } = await userClient
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  if (!me || (me as { app_role: string }).app_role !== 'admin') {
    return { error: 'No autorizado' }
  }
  return { ok: true }
}

export async function getJoulieEnabled(): Promise<{ enabled: boolean; ready: boolean }> {
  const auth = await assertAdmin()
  if ('error' in auth) return { enabled: true, ready: false }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('joulie_config')
      .select('enabled')
      .eq('id', 'singleton')
      .maybeSingle()
    if (error || !data || typeof (data as { enabled?: boolean }).enabled !== 'boolean') {
      return { enabled: true, ready: false }
    }
    return { enabled: (data as { enabled: boolean }).enabled, ready: true }
  } catch {
    return { enabled: true, ready: false }
  }
}

export async function setJoulieEnabled(
  enabled: boolean
): Promise<{ ok: true; enabled: boolean } | { error: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return auth
  if (typeof enabled !== 'boolean') return { error: 'Valor inválido' }

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('joulie_config').upsert({
      id: 'singleton',
      enabled,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      return {
        error:
          'No pude guardar. Si es la primera vez, ejecuta supabase/sql/joulie_config.sql en el editor SQL de Supabase.',
      }
    }
  } catch {
    return {
      error:
        'No pude guardar. Si es la primera vez, ejecuta supabase/sql/joulie_config.sql en el editor SQL de Supabase.',
    }
  }

  revalidatePath('/admin/joulie')
  return { ok: true, enabled }
}
