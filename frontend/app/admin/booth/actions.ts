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

export async function exportBoothEventCSV(
  id: string
): Promise<{ ok: true; filename: string; csv: string } | { error: string }> {
  const auth = await assertAdmin()
  if ('error' in auth) return auth

  if (!id || typeof id !== 'string') {
    return { error: 'ID inválido' }
  }

  const admin = createAdminClient()

  // Obtener el evento
  const { data: eventRow, error: evErr } = await admin
    .from('booth_events')
    .select('event_name')
    .eq('id', id)
    .maybeSingle()

  if (evErr || !eventRow) return { error: 'Evento no encontrado' }
  const event_name = (eventRow as { event_name: string }).event_name

  // Obtener usuarios marcados con este evento
  const { data: usersRows, error: uErr } = await admin
    .from('users')
    .select('id, email, alias, nombre, created_at')
    .eq('registered_at_event', event_name)
    .order('created_at', { ascending: true })

  if (uErr) return { error: uErr.message }

  type UserRow = {
    id: string
    email: string | null
    alias: string | null
    nombre: string | null
    created_at: string
  }
  const users = (usersRows ?? []) as UserRow[]

  // Helper para escapar CSV (RFC 4180)
  function csvEscape(value: string | null): string {
    if (value === null || value === undefined) return ''
    const s = String(value)
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const header = [
    'email',
    'alias',
    'nombre',
    'fecha_registro',
    'onboarding_completo',
  ].join(',')

  const rows = users.map((u) => {
    const onboarding = u.alias && u.alias.trim().length > 0 ? 'Sí' : 'No'
    return [
      csvEscape(u.email),
      csvEscape(u.alias),
      csvEscape(u.nombre),
      csvEscape(u.created_at),
      csvEscape(onboarding),
    ].join(',')
  })

  // Agregar BOM para que Excel reconozca UTF-8 correctamente
  const csv = '\uFEFF' + [header, ...rows].join('\r\n')

  const today = new Date().toISOString().slice(0, 10)
  const filename = `booth_${event_name.toLowerCase()}_${today}.csv`

  return { ok: true, filename, csv }
}
