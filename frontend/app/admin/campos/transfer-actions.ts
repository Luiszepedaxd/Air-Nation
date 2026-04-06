'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export async function transferFieldAction(
  fieldId: string,
  newUserId: string
): Promise<{ success: true } | { error: string }> {
  const admin = await requireAppAdminUserId()
  if (!admin) {
    return { error: 'No autorizado.' }
  }

  const fid = fieldId?.trim()
  const uid = newUserId?.trim()
  if (!fid || !uid) {
    return { error: 'Datos no válidos.' }
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('fields')
    .update({
      created_by: uid,
      transferred_to: uid,
      transferred_at: now,
    })
    .eq('id', fid)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/campos')
  revalidatePath('/campos')
  return { success: true }
}
