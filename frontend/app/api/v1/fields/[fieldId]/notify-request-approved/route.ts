import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'

type Body = {
  solicitante_email?: string
  solicitante_nombre?: string
  field_nombre?: string
  event_id?: string
  fecha_deseada?: string
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

export async function POST(
  req: Request,
  { params }: { params: { fieldId: string } }
) {
  const fieldId = params.fieldId?.trim()
  if (!fieldId) {
    return NextResponse.json({ error: 'fieldId requerido' }, { status: 400 })
  }

  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: fieldRow, error: fieldErr } = await supabase
    .from('fields')
    .select('id, created_by')
    .eq('id', fieldId)
    .maybeSingle()

  if (fieldErr || !fieldRow || fieldRow.created_by !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const solicitante_email = body.solicitante_email?.trim()
  const solicitante_nombre = body.solicitante_nombre?.trim() || 'Jugador'
  const field_nombre = body.field_nombre?.trim() || 'el campo'
  const event_id = body.event_id?.trim()
  const fecha_deseada = body.fecha_deseada?.trim() || 'la fecha acordada'

  if (!isNonEmptyString(solicitante_email)) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: 'sin email del solicitante' },
      { status: 200 }
    )
  }
  if (!isNonEmptyString(event_id)) {
    return NextResponse.json({ error: 'event_id requerido' }, { status: 400 })
  }

  const { data: ev, error: evErr } = await supabase
    .from('events')
    .select('id, field_id')
    .eq('id', event_id)
    .maybeSingle()

  if (evErr || !ev || ev.field_id !== fieldId) {
    return NextResponse.json({ error: 'Evento no válido' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: 'RESEND_API_KEY no configurada' },
      { status: 200 }
    )
  }

  const resend = new Resend(apiKey)
  const textBody = `Tu solicitud para ${field_nombre} el ${fecha_deseada} fue aprobada.\n\nVer el evento: https://airnation.online/eventos/${event_id}`

  const { error: sendErr } = await resend.emails.send({
    from: 'AirNation <info@airnation.online>',
    to: solicitante_email,
    subject: 'Tu solicitud fue aprobada — AirNation',
    text: textBody,
  })

  if (sendErr) {
    return NextResponse.json(
      { error: sendErr.message || 'Error al enviar correo' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true })
}
