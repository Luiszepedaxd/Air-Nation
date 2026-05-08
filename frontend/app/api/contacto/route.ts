import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const TIPOS_VALIDOS = [
  'patrocinio',
  'feedback',
  'alianza',
  'otro',
] as const

type TipoContacto = (typeof TIPOS_VALIDOS)[number]

function tipoLabel(tipo: TipoContacto): string {
  switch (tipo) {
    case 'patrocinio':
      return 'Patrocinio de evento'
    case 'feedback':
      return 'Feedback / sugerencia'
    case 'alianza':
      return 'Alianza comercial'
    case 'otro':
      return 'Otro'
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>

    const tipo = String(body.tipo ?? '').trim() as TipoContacto
    const nombre = String(body.nombre ?? '').trim()
    const email = String(body.email ?? '').trim()
    const empresa = String(body.empresa ?? '').trim()
    const mensaje = String(body.mensaje ?? '').trim()

    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de contacto inválido' },
        { status: 400 }
      )
    }
    if (nombre.length < 2 || nombre.length > 120) {
      return NextResponse.json(
        { error: 'Nombre inválido' },
        { status: 400 }
      )
    }
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }
    if (mensaje.length < 10 || mensaje.length > 4000) {
      return NextResponse.json(
        { error: 'El mensaje debe tener entre 10 y 4000 caracteres' },
        { status: 400 }
      )
    }
    if (empresa.length > 200) {
      return NextResponse.json(
        { error: 'Empresa demasiado larga' },
        { status: 400 }
      )
    }

    const apiKey = process.env.RESEND_API_KEY?.trim()
    if (!apiKey) {
      console.error('[contacto] RESEND_API_KEY no configurada')
      return NextResponse.json(
        { error: 'Servicio de email no disponible' },
        { status: 503 }
      )
    }

    const resend = new Resend(apiKey)

    const safeNombre = escapeHtml(nombre)
    const safeEmail = escapeHtml(email)
    const safeEmpresa = empresa ? escapeHtml(empresa) : ''
    const safeMensaje = escapeHtml(mensaje).replace(/\n/g, '<br>')
    const safeTipo = escapeHtml(tipoLabel(tipo))

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#111111;padding:20px 24px">
      <span style="color:#fff;font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.18em">
        AIR<span style="color:#CC4B37">NATION</span>
      </span>
      <span style="background:#CC4B37;color:#fff;font-size:9px;font-weight:800;text-transform:uppercase;padding:2px 6px;margin-left:6px;letter-spacing:0.1em">CONTACTO</span>
    </div>
    <div style="background:#fff;padding:24px">
      <p style="font-size:11px;color:#CC4B37;font-weight:800;text-transform:uppercase;letter-spacing:0.18em;margin:0 0 8px">${safeTipo}</p>
      <h2 style="font-size:18px;color:#111;margin:0 0 24px;font-weight:900;text-transform:uppercase;letter-spacing:0.04em">Nuevo mensaje desde airnation.online</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666;width:100px"><strong>Nombre</strong></td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111">${safeNombre}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666"><strong>Email</strong></td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111"><a href="mailto:${safeEmail}" style="color:#CC4B37;text-decoration:none">${safeEmail}</a></td>
        </tr>
        ${
          safeEmpresa
            ? `<tr>
                 <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666"><strong>Empresa / Equipo</strong></td>
                 <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111">${safeEmpresa}</td>
               </tr>`
            : ''
        }
      </table>
      <div style="background:#f7f7f7;padding:16px;border-left:3px solid #CC4B37;margin-bottom:16px">
        <p style="font-size:11px;color:#666;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 8px">Mensaje</p>
        <p style="font-size:14px;color:#333;margin:0;line-height:1.6">${safeMensaje}</p>
      </div>
      <p style="font-size:12px;color:#999;margin:24px 0 0">
        Responde directamente a este email para contactar a ${safeNombre}.
      </p>
    </div>
    <div style="background:#111;padding:16px 24px;text-align:center">
      <p style="color:#666;font-size:11px;margin:0">© ${new Date().getFullYear()} AirNation</p>
    </div>
  </div>
</body>
</html>`

    const { error } = await resend.emails.send({
      from: 'AirNation <info@airnation.online>',
      to: 'info@airnation.online',
      replyTo: email,
      subject: `[Contacto - ${tipoLabel(tipo)}] ${nombre}`,
      html,
    })

    if (error) {
      console.error('[contacto] resend error:', error)
      return NextResponse.json(
        { error: 'Error al enviar el mensaje' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contacto] unexpected:', err)
    return NextResponse.json(
      { error: 'Error inesperado' },
      { status: 500 }
    )
  }
}
