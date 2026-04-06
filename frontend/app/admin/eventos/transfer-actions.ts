'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export async function transferEventAction(
  eventId: string,
  newUserId: string
): Promise<{ success: true } | { error: string }> {
  const admin = await requireAppAdminUserId()
  if (!admin) {
    return { error: 'No autorizado.' }
  }

  const eid = eventId?.trim()
  const uid = newUserId?.trim()
  if (!eid || !uid) {
    return { error: 'Datos no válidos.' }
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('events')
    .update({
      organizador_id: uid,
      created_by: uid,
      transferred_to: uid,
      transferred_at: now,
    })
    .eq('id', eid)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/eventos')
  revalidatePath('/eventos')
  return { success: true }
}
