'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export type CreateMailingInput = {
  asunto: string
  html: string
  recipient_emails: string[]
}

export async function createMailingAction(
  input: CreateMailingInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const asunto = input.asunto?.trim()
  const html = input.html?.trim()
  const emails = (input.recipient_emails ?? []).filter(
    (e) => typeof e === 'string' && e.trim().length > 0
  )

  if (!asunto) return { error: 'Asunto requerido.' }
  if (!html) return { error: 'HTML requerido.' }
  if (emails.length === 0)
    return { error: 'Al menos un destinatario requerido.' }

  const db = createAdminClient()
  const { data, error } = await db
    .from('admin_mailings')
    .insert({
      asunto,
      html,
      recipient_count: emails.length,
      recipient_emails: emails,
      enviado_por: adminId,
      status: 'sending',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  return { ok: true, id: (data as { id: string }).id }
}

export async function completeMailingAction(
  id: string,
  result: { sent_count: number; failed_count: number }
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  if (!id?.trim()) return { error: 'id requerido.' }

  const db = createAdminClient()
  const status = result.failed_count === 0 ? 'completed' : 'failed'

  const { error } = await db
    .from('admin_mailings')
    .update({
      sent_count: result.sent_count,
      failed_count: result.failed_count,
      status,
      completed_at: new Date().toISOString(),
    })
    .eq('id', id.trim())

  if (error) return { error: error.message }

  revalidatePath('/admin/mailings')
  return { ok: true }
}

export async function failMailingAction(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  if (!id?.trim()) return { error: 'id requerido.' }

  const db = createAdminClient()
  const { error } = await db
    .from('admin_mailings')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id.trim())

  if (error) return { error: error.message }

  revalidatePath('/admin/mailings')
  return { ok: true }
}
