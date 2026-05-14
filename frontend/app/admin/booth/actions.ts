'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export async function updateBoothConfig(input: {
  active: boolean
  event_name: string | null
}): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado' }

  let event_name = input.event_name?.trim() || null
  if (event_name) {
    event_name = event_name.toUpperCase().replace(/[^A-Z0-9_-]/g, '_').slice(0, 50)
    if (!event_name) event_name = null
  }
  if (input.active && !event_name) {
    return { error: 'Si activas el booth necesitas nombre de evento.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('booth_config')
    .update({
      active: input.active,
      event_name,
      updated_at: new Date().toISOString(),
      updated_by: adminId,
    })
    .eq('id', 1)

  if (error) return { error: error.message }

  revalidatePath('/admin/booth')
  return { ok: true }
}
