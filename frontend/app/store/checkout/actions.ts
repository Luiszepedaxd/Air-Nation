'use server'

import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { revalidatePath } from 'next/cache'

export type DireccionEnvio = {
  nombre: string
  email: string
  telefono: string
  calle: string
  numero: string
  colonia: string
  ciudad: string
  estado: string
  cp: string
  referencias?: string
}

export type CheckoutItem = {
  product_id: string
  nombre: string
  foto_url: string | null
  precio: number
  cantidad: number
}

export type CreateOrderInput = {
  items: CheckoutItem[]
  direccion: DireccionEnvio
  metodo_pago: 'transferencia' | 'tarjeta'
  user_id?: string | null
}

function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `AN${year}${month}${day}-${rand}`
}

export async function createOrder(
  input: CreateOrderInput
): Promise<
  | { ok: true; order_id: string; order_number: string }
  | { error: string }
> {
  const supabase = createDashboardSupabaseServerClient()

  if (!input.items.length) return { error: 'El carrito está vacío.' }
  if (!input.direccion.nombre.trim()) return { error: 'El nombre es requerido.' }
  if (!input.direccion.email.trim()) return { error: 'El email es requerido.' }
  if (!input.direccion.calle.trim()) return { error: 'La dirección es requerida.' }
  if (!input.direccion.cp.trim()) return { error: 'El código postal es requerido.' }

  for (const item of input.items) {
    const { data: prod } = await supabase
      .from('store_products')
      .select('stock, nombre, activo')
      .eq('id', item.product_id)
      .maybeSingle()

    const row = prod as { stock: number; nombre: string; activo: boolean } | null
    if (!row || !row.activo) {
      return { error: `El producto "${item.nombre}" ya no está disponible.` }
    }
    if (row.stock < item.cantidad) {
      return {
        error: `Stock insuficiente para "${item.nombre}". Solo quedan ${row.stock}.`,
      }
    }
  }

  const subtotal = input.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const descuento_pct = input.metodo_pago === 'transferencia' ? 4 : 0
  const descuento_monto = Math.round(subtotal * (descuento_pct / 100))
  const order_number = generateOrderNumber()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const user_id = user?.id ?? input.user_id ?? null

  const { data: order, error: orderError } = await supabase
    .from('store_orders')
    .insert({
      order_number,
      user_id,
      guest_email: user_id ? null : input.direccion.email,
      guest_nombre: user_id ? null : input.direccion.nombre,
      direccion_envio: input.direccion,
      metodo_pago: input.metodo_pago,
      descuento_pct,
      subtotal,
      descuento_monto,
      total: subtotal - descuento_monto,
      status_interno: 'nueva',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('[checkout] crear orden:', orderError?.message)
    return { error: 'Error al crear la orden. Intenta de nuevo.' }
  }

  const orderId = (order as { id: string }).id

  const orderItems = input.items.map((item) => ({
    order_id: orderId,
    product_id: item.product_id,
    nombre: item.nombre,
    foto_url: item.foto_url,
    precio_unit: item.precio,
    cantidad: item.cantidad,
    subtotal: item.precio * item.cantidad,
  }))

  const { error: itemsError } = await supabase
    .from('store_order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('[checkout] crear items:', itemsError.message)
    await supabase.from('store_orders').delete().eq('id', orderId)
    return { error: 'Error al guardar los productos. Intenta de nuevo.' }
  }

  for (const item of input.items) {
    const { error } = await supabase.rpc('decrement_product_stock', {
      p_product_id: item.product_id,
      p_cantidad: item.cantidad,
    })
    if (error) {
      console.error('[checkout] stock:', item.product_id, error.message)
    }
  }

  revalidatePath('/admin/store')
  return { ok: true, order_id: orderId, order_number }
}

export async function getDatosBancarios(): Promise<{
  banco: string
  clabe: string
  titular: string
  concepto: string
}> {
  const supabase = createDashboardSupabaseServerClient()
  const { data } = await supabase
    .from('store_config')
    .select('value')
    .eq('key', 'datos_bancarios')
    .maybeSingle()

  const row = data as { value?: Record<string, string> } | null
  const v = row?.value ?? {}
  return {
    banco: v.banco ?? '',
    clabe: v.clabe ?? '',
    titular: v.titular ?? '',
    concepto: v.concepto ?? 'Pedido AirNation #[ORDER_NUMBER]',
  }
}
