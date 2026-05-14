'use server'

import { revalidatePath } from 'next/cache'
import {
  createAdminSupabaseServerClient,
  createAdminClient,
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

function sanitizeName(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 50)
}

export async function createBoothEvent(
  rawName: string
): Promise<{ ok: true } | { error: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return auth

  const event_name = sanitizeName(rawName)
  if (!event_name || event_name.length < 2) {
    return { error: 'Nombre inválido. Mínimo 2 caracteres.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('booth_events')
    .insert({ event_name, active: false, created_by: auth.userId })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe un evento con ese nombre.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/booth')
  return { ok: true }
}

export async function toggleBoothEvent(
  id: string,
  newActive: boolean
): Promise<{ ok: true } | { error: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return auth

  if (!id || typeof id !== 'string') {
    return { error: 'ID inválido' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('booth_events')
    .update({ active: newActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/booth')
  return { ok: true }
}

export async function deleteBoothEvent(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return auth

  if (!id || typeof id !== 'string') {
    return { error: 'ID inválido' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('booth_events')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/booth')
  return { ok: true }
}
