'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../supabase-server'
import { requireAppAdminUserId } from '../../require-app-admin'

export type OrderStatus =
  | 'nueva'
  | 'pago_confirmado'
  | 'en_preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado'

export async function updateOrderStatus(
  id: string,
  status_interno: OrderStatus
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('store_orders')
    .update({ status_interno, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/store/orders')
  return { ok: true }
}

export async function updateOrderEnvio(
  id: string,
  data: {
    costo_envio?: number
    guia_numero?: string
    guia_paqueteria?: string
    notas_internas?: string
  }
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('store_orders')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/store/orders')
  return { ok: true }
}

export async function confirmarTransferencia(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('store_orders')
    .update({
      transferencia_confirmada: true,
      transferencia_fecha: new Date().toISOString(),
      status_interno: 'pago_confirmado',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/store/orders')
  return { ok: true }
}
