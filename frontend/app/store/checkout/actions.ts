'use server'

import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

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
  costo_envio: number
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

  const order_number = generateOrderNumber()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const user_id = user?.id ?? input.user_id ?? null
  const costo_envio = input.costo_envio ?? 0

  const subtotal = input.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const descuento_pct = input.metodo_pago === 'transferencia' ? 4 : 0
  const descuento_monto = Math.round(subtotal * (descuento_pct / 100))
  const total_con_envio = subtotal - descuento_monto + costo_envio

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
      costo_envio,
      cp_destino: input.direccion.cp,
      total: total_con_envio,
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

  const { data: configRow } = await supabase
    .from('store_config')
    .select('value')
    .eq('key', 'datos_bancarios')
    .maybeSingle()

  const datosBancarios = (configRow as { value?: unknown } | null)?.value
    ? ((configRow as { value: { banco: string; clabe: string; titular: string; concepto: string } }).value)
    : null

  await sendOrderConfirmationEmail({
    email: input.direccion.email,
    nombre: input.direccion.nombre,
    order_number,
    items: input.items,
    subtotal,
    descuento_monto,
    costo_envio,
    total: total_con_envio,
    metodo_pago: input.metodo_pago,
    direccion: input.direccion,
    datosBancarios,
  })

  return { ok: true, order_id: orderId, order_number }
}

async function sendOrderConfirmationEmail(params: {
  email: string
  nombre: string
  order_number: string
  items: CheckoutItem[]
  subtotal: number
  descuento_monto: number
  costo_envio: number
  total: number
  metodo_pago: 'transferencia' | 'tarjeta'
  direccion: DireccionEnvio
  datosBancarios: { banco: string; clabe: string; titular: string; concepto: string } | null
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return

  const resend = new Resend(apiKey)

  const {
    email, nombre, order_number, items, subtotal,
    descuento_monto, costo_envio, total, metodo_pago, direccion, datosBancarios,
  } = params

  const concepto = datosBancarios?.concepto?.replace('[ORDER_NUMBER]', order_number) ?? `Pedido AirNation #${order_number}`

  const itemsHtml = items
    .map(i => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333">${i.nombre}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;text-align:center">x${i.cantidad}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111;text-align:right;font-weight:bold">$${(i.precio * i.cantidad).toLocaleString('es-MX')}</td>
      </tr>
    `)
    .join('')

  const bancarioHtml = metodo_pago === 'transferencia' && datosBancarios?.clabe
    ? `
      <div style="background:#0a0a0a;border-radius:4px;padding:20px;margin:24px 0">
        <p style="color:#CC4B37;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 12px">Datos para tu transferencia</p>
        ${datosBancarios.banco ? `<p style="color:#fff;font-size:13px;margin:4px 0"><span style="color:#999">Banco:</span> <strong>${datosBancarios.banco}</strong></p>` : ''}
        <p style="color:#fff;font-size:13px;margin:4px 0"><span style="color:#999">CLABE:</span> <strong style="font-family:monospace">${datosBancarios.clabe}</strong></p>
        ${datosBancarios.titular ? `<p style="color:#fff;font-size:13px;margin:4px 0"><span style="color:#999">Titular:</span> <strong>${datosBancarios.titular}</strong></p>` : ''}
        <p style="color:#fff;font-size:16px;margin:12px 0 4px"><span style="color:#999;font-size:13px">Monto:</span> <strong style="color:#22C55E">$${total.toLocaleString('es-MX')}</strong></p>
        <p style="color:#fff;font-size:13px;margin:4px 0"><span style="color:#999">Concepto:</span> <strong>${concepto}</strong></p>
        <div style="background:#1a1a1a;border-radius:4px;padding:12px;margin-top:16px">
          <p style="color:#999;font-size:11px;margin:0;line-height:1.6">
            Una vez realizada la transferencia, envía tu comprobante a 
            <strong style="color:#fff">info@airnation.online</strong> 
            con el número <strong style="color:#CC4B37">#${order_number}</strong>.
            Tu pedido se reserva por <strong style="color:#fff">48 horas</strong>.
          </p>
        </div>
      </div>
    `
    : metodo_pago === 'transferencia'
    ? `
      <div style="background:#f5f5f5;border-radius:4px;padding:16px;margin:24px 0">
        <p style="color:#333;font-size:13px;margin:0">
          Te enviaremos los datos bancarios en los próximos minutos a este correo.
          Mientras tanto, puedes escribirnos a <strong>info@airnation.online</strong> 
          con el número <strong style="color:#CC4B37">#${order_number}</strong>.
        </p>
      </div>
    `
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    
    <!-- Header -->
    <div style="background:#111111;padding:20px 24px;margin-bottom:0">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="color:#fff;font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em">
              AIR<span style="color:#CC4B37">NATION</span>
            </span>
            <span style="background:#CC4B37;color:#fff;font-size:9px;font-weight:800;text-transform:uppercase;padding:2px 6px;margin-left:6px;letter-spacing:0.1em">STORE</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Success banner -->
    <div style="background:#CC4B37;padding:24px;text-align:center">
      <p style="color:#fff;font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 4px">¡Pedido confirmado!</p>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0">Número de pedido: <strong style="color:#fff;font-size:15px">#${order_number}</strong></p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:24px">
      <p style="font-size:14px;color:#333;margin:0 0 20px">
        Hola <strong>${nombre}</strong>, recibimos tu pedido. Aquí tienes el resumen:
      </p>

      <!-- Productos -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
        <thead>
          <tr>
            <th style="text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#999;padding-bottom:8px;border-bottom:2px solid #111">Producto</th>
            <th style="text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#999;padding-bottom:8px;border-bottom:2px solid #111">Cant.</th>
            <th style="text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#999;padding-bottom:8px;border-bottom:2px solid #111">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totales -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
        <tr>
          <td style="font-size:12px;color:#666;padding:4px 0">Subtotal</td>
          <td style="font-size:12px;color:#333;text-align:right;padding:4px 0">$${subtotal.toLocaleString('es-MX')}</td>
        </tr>
        ${descuento_monto > 0 ? `
        <tr>
          <td style="font-size:12px;color:#22C55E;padding:4px 0">Descuento transferencia (4%)</td>
          <td style="font-size:12px;color:#22C55E;text-align:right;padding:4px 0">−$${descuento_monto.toLocaleString('es-MX')}</td>
        </tr>` : ''}
        <tr>
          <td style="font-size:12px;color:#555;padding:4px 0">Envío a todo México</td>
          <td style="font-size:12px;color:#22C55E;font-weight:bold;text-align:right;padding:4px 0">Gratis</td>
        </tr>
        <tr style="border-top:2px solid #111">
          <td style="font-size:15px;font-weight:800;color:#111;padding:10px 0 4px;text-transform:uppercase;letter-spacing:0.05em">Total</td>
          <td style="font-size:15px;font-weight:800;color:#111;text-align:right;padding:10px 0 4px">$${total.toLocaleString('es-MX')}</td>
        </tr>
      </table>

      <!-- Dirección -->
      <div style="background:#f7f7f7;border-radius:4px;padding:16px;margin:20px 0">
        <p style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin:0 0 8px">Dirección de envío</p>
        <p style="font-size:13px;color:#333;margin:0;line-height:1.6">
          ${direccion.calle} ${direccion.numero}${direccion.colonia ? `, ${direccion.colonia}` : ''}<br>
          ${direccion.ciudad}, ${direccion.estado} CP ${direccion.cp}
          ${direccion.referencias ? `<br><span style="color:#999">Ref: ${direccion.referencias}</span>` : ''}
        </p>
      </div>

      <!-- Datos bancarios o confirmación tarjeta -->
      ${bancarioHtml}

      <!-- Próximos pasos -->
      <div style="margin:24px 0">
        <p style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin:0 0 12px">¿Qué sigue?</p>
        <ol style="padding-left:20px;margin:0;color:#333;font-size:13px;line-height:2">
          <li>${metodo_pago === 'transferencia' ? 'Realiza la transferencia con los datos de arriba' : 'Tu pago está siendo procesado'}</li>
          <li>Confirmaremos tu pedido por email</li>
          <li>Tu pedido es preparado y enviado al día hábil siguiente</li>
          <li>Enviamos tu pedido con número de guía</li>
        </ol>
      </div>

      <p style="font-size:13px;color:#666;margin:24px 0 0">
        ¿Dudas? Escríbenos a <a href="mailto:info@airnation.online" style="color:#CC4B37;text-decoration:none">info@airnation.online</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#111;padding:16px 24px;text-align:center">
      <p style="color:#666;font-size:11px;margin:0">
        © ${new Date().getFullYear()} AirNation · 
        <a href="https://airnation.online/store" style="color:#CC4B37;text-decoration:none">Seguir comprando</a>
      </p>
    </div>

  </div>
</body>
</html>
  `

  await resend.emails.send({
    from: 'AirNation Store <info@airnation.online>',
    to: email,
    subject: `Pedido confirmado #${order_number} — AirNation Store`,
    html,
  }).catch(err => {
    console.error('[email] order confirmation:', err)
  })
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
