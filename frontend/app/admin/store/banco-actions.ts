'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export async function saveDatosBancarios(datos: {
  banco: string
  clabe: string
  titular: string
  concepto: string
}): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db.from('store_config').upsert({
    key: 'datos_bancarios',
    value: datos,
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store/checkout')
  return { ok: true }
}
