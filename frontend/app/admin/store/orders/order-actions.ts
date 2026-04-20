'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../../supabase-server'
import { requireAppAdminUserId } from '../../require-app-admin'
import { Resend } from 'resend'

export type OrderStatus =
  | 'nueva'
  | 'pago_confirmado'
  | 'en_preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado'

// ─────────────────────────────────────────────────────────────
// Email helpers
// ─────────────────────────────────────────────────────────────
function emailBase(contenido: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#111111;padding:20px 24px;margin-bottom:0">
      <span style="color:#fff;font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em">
        AIR<span style="color:#CC4B37">NATION</span>
      </span>
      <span style="background:#CC4B37;color:#fff;font-size:9px;font-weight:800;text-transform:uppercase;padding:2px 6px;margin-left:6px;letter-spacing:0.1em">STORE</span>
    </div>
    <div style="background:#fff;padding:24px">
      ${contenido}
      <p style="font-size:13px;color:#666;margin:24px 0 0">
        ¿Dudas? Escríbenos a <a href="mailto:info@airnation.online" style="color:#CC4B37;text-decoration:none">info@airnation.online</a>
      </p>
    </div>
    <div style="background:#111;padding:16px 24px;text-align:center">
      <p style="color:#666;font-size:11px;margin:0">
        © ${new Date().getFullYear()} AirNation ·
        <a href="https://airnation.online/store/pedidos" style="color:#CC4B37;text-decoration:none">Ver mis pedidos</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return
  const resend = new Resend(apiKey)
  await resend.emails
    .send({
      from: 'AirNation Store <info@airnation.online>',
      to,
      subject,
      html,
    })
    .catch((err) => console.error('[email]', subject, err))
}

async function sendPagoConfirmadoEmail(
  email: string,
  order_number: string,
  nombre: string
) {
  const html = emailBase(`
    <div style="background:#CC4B37;padding:20px 24px;margin:-24px -24px 24px;text-align:center">
      <p style="color:#fff;font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin:0">Pago confirmado</p>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0">Pedido <strong style="color:#fff">#${order_number}</strong></p>
    </div>
    <p style="font-size:14px;color:#333;margin:0 0 16px">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size:14px;color:#333;margin:0 0 16px">
      Confirmamos la recepción de tu pago. Tu arsenal está siendo preparado con cuidado desde el Cuartel General.
    </p>
    <div style="background:#f7f7f7;border-left:3px solid #CC4B37;padding:16px;margin:20px 0">
      <p style="font-size:13px;color:#333;margin:0;line-height:1.6">
        En breve te notificaremos cuando tu pedido salga de nuestras instalaciones con el número de guía para rastrearlo.
      </p>
    </div>
    <a href="https://airnation.online/store/pedidos" style="display:inline-block;background:#111111;color:#fff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;padding:12px 24px;text-decoration:none;margin-top:8px">Ver estado del pedido</a>
  `)
  await sendEmail(email, `Pago confirmado — Pedido #${order_number}`, html)
}

async function sendEnviadoEmail(
  email: string,
  order_number: string,
  nombre: string,
  guia_numero: string,
  guia_paqueteria: string
) {
  const html = emailBase(`
    <div style="background:#111111;padding:20px 24px;margin:-24px -24px 24px;text-align:center">
      <p style="color:#CC4B37;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 6px">Pedido #${order_number}</p>
      <p style="color:#fff;font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin:0">Tu pedido salió del Cuartel General</p>
    </div>
    <p style="font-size:14px;color:#333;margin:0 0 16px">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size:14px;color:#333;margin:0 0 20px">
      Tu arsenal está en camino. A continuación los datos para rastrear tu envío:
    </p>
    <div style="background:#0a0a0a;border-radius:4px;padding:20px;margin:0 0 20px">
      ${
        guia_paqueteria
          ? `<p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px">Paquetería</p>
      <p style="color:#fff;font-size:15px;font-weight:800;margin:0 0 16px">${guia_paqueteria}</p>`
          : ''
      }
      <p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px">Número de guía</p>
      <p style="color:#CC4B37;font-size:18px;font-weight:800;font-family:monospace;margin:0">${guia_numero}</p>
    </div>
    <div style="background:#f7f7f7;border-left:3px solid #CC4B37;padding:16px;margin:0 0 20px">
      <p style="font-size:12px;color:#666;margin:0;line-height:1.6">
        Tu pedido está protegido durante el tránsito. Si tienes algún problema con la entrega, escríbenos de inmediato.
      </p>
    </div>
    <a href="https://airnation.online/store/pedidos" style="display:inline-block;background:#CC4B37;color:#fff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;padding:12px 24px;text-decoration:none">Rastrear pedido</a>
  `)
  await sendEmail(
    email,
    `Tu pedido #${order_number} salió del Cuartel General`,
    html
  )
}

async function sendEntregadoEmail(
  email: string,
  order_number: string,
  nombre: string
) {
  const html = emailBase(`
    <div style="background:#CC4B37;padding:20px 24px;margin:-24px -24px 24px;text-align:center">
      <p style="color:#fff;font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin:0">Mision cumplida</p>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0">Pedido <strong style="color:#fff">#${order_number}</strong> entregado</p>
    </div>
    <p style="font-size:14px;color:#333;margin:0 0 16px">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size:14px;color:#333;margin:0 0 16px">
      Tu pedido ha sido entregado. Esperamos que tu nuevo equipo supere todas tus expectativas en el campo.
    </p>
    <p style="font-size:14px;color:#333;margin:0 0 20px">
      Tu experiencia de compra nos importa — cuéntanos cómo te fue.
    </p>
    <a href="https://airnation.online/store/pedidos" style="display:inline-block;background:#111111;color:#fff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;padding:12px 24px;text-decoration:none;margin-bottom:12px">Ver mis pedidos</a>
  `)
  await sendEmail(
    email,
    `Mision cumplida — Tu pedido #${order_number} fue entregado`,
    html
  )
}

async function sendCanceladoEmail(
  email: string,
  order_number: string,
  nombre: string
) {
  const html = emailBase(`
    <div style="background:#f7f7f7;border-top:3px solid #CC4B37;padding:20px 24px;margin:-24px -24px 24px">
      <p style="color:#111;font-size:16px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin:0">Pedido cancelado</p>
      <p style="color:#666;font-size:13px;margin:4px 0 0">Pedido <strong>#${order_number}</strong></p>
    </div>
    <p style="font-size:14px;color:#333;margin:0 0 16px">Hola <strong>${nombre}</strong>,</p>
    <p style="font-size:14px;color:#333;margin:0 0 16px">
      Tu pedido ha sido cancelado. Si realizaste algún pago, procesaremos el reembolso correspondiente.
    </p>
    <p style="font-size:14px;color:#333;margin:0 0 20px">
      Si tienes alguna duda o crees que esto fue un error, escríbenos y lo resolvemos.
    </p>
    <a href="https://airnation.online/store" style="display:inline-block;background:#CC4B37;color:#fff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;padding:12px 24px;text-decoration:none">Volver a la tienda</a>
  `)
  await sendEmail(email, `Pedido #${order_number} cancelado — AirNation Store`, html)
}

// ─────────────────────────────────────────────────────────────
// Server actions
// ─────────────────────────────────────────────────────────────
export async function updateOrderStatus(
  id: string,
  status_interno: OrderStatus
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()

  const { data: order } = await db
    .from('store_orders')
    .select(
      'order_number, comprador_email, direccion_envio, guia_numero, guia_paqueteria'
    )
    .eq('id', id)
    .maybeSingle()

  const { error } = await db
    .from('store_orders')
    .update({ status_interno, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  if (order) {
    const email = String(order.comprador_email ?? '')
    const order_number = String(order.order_number ?? '')
    const dir = (order.direccion_envio ?? {}) as Record<string, string>
    const nombre = dir.nombre || 'Operador'

    if (email) {
      if (status_interno === 'pago_confirmado') {
        await sendPagoConfirmadoEmail(email, order_number, nombre)
      } else if (status_interno === 'enviado') {
        await sendEnviadoEmail(
          email,
          order_number,
          nombre,
          String(order.guia_numero ?? ''),
          String(order.guia_paqueteria ?? '')
        )
      } else if (status_interno === 'entregado') {
        await sendEntregadoEmail(email, order_number, nombre)
      } else if (status_interno === 'cancelado') {
        await sendCanceladoEmail(email, order_number, nombre)
      }
    }
  }

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

  const { data: order } = await db
    .from('store_orders')
    .select('order_number, comprador_email, direccion_envio')
    .eq('id', id)
    .maybeSingle()

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

  if (order) {
    const email = String(order.comprador_email ?? '')
    const order_number = String(order.order_number ?? '')
    const dir = (order.direccion_envio ?? {}) as Record<string, string>
    const nombre = dir.nombre || 'Operador'
    if (email) {
      await sendPagoConfirmadoEmail(email, order_number, nombre)
    }
  }

  revalidatePath('/admin/store/orders')
  return { ok: true }
}

export async function subirComprobante(
  order_id: string,
  comprobante_url: string
): Promise<{ ok: true } | { error: string }> {
  const db = createAdminClient()

  const { error } = await db
    .from('store_orders')
    .update({
      comprobante_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/store/orders')
  revalidatePath('/store/pedidos')
  return { ok: true }
}
