export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createAdminClient } from '../../supabase-server'
import { requireAppAdminUserId } from '../../require-app-admin'
import { OrdersClient } from './OrdersClient'

export default async function OrdersPage() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const db = createAdminClient()

  const { data: orders, error } = await db
    .from('store_orders')
    .select(
      `
      id, order_number, user_id, guest_email, guest_nombre,
      direccion_envio, metodo_pago, descuento_pct, subtotal,
      descuento_monto, costo_envio, total, transferencia_confirmada,
      transferencia_fecha, status_interno, guia_numero, guia_paqueteria,
      notas_internas, envio_protegido, created_at, updated_at
    `
    )
    .order('created_at', { ascending: false })

  if (error) console.error('[admin/orders]', error.message)

  const orderRows = (orders ?? []) as { id: string; user_id: string | null }[]
  const orderIds = orderRows.map((o) => o.id)

  const itemsRes = orderIds.length
    ? await db
        .from('store_order_items')
        .select('order_id, product_id, nombre, foto_url, precio_unit, cantidad, subtotal')
        .in('order_id', orderIds)
    : { data: [] as unknown[] }

  const profiles: Record<string, unknown>[] = []

  return (
    <div className="p-6">
      <OrdersClient
        orders={(orders ?? []) as Record<string, unknown>[]}
        items={(itemsRes.data ?? []) as Record<string, unknown>[]}
        profiles={profiles}
      />
    </div>
  )
}
