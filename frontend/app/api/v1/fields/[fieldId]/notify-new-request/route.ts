import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'

type Body = {
  solicitante_nombre?: string
  solicitante_alias?: string
  field_nombre?: string
  fecha_deseada?: string
  num_jugadores?: number
  mensaje?: string | null
}

function formatFechaParaCorreo(raw: string | undefined): string {
  if (!raw?.trim()) return 'fecha por confirmar'
  const t = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, d] = t.split('-')
    return `${d}/${m}/${y}`
  }
  return t
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

  const { data: pendingOwn } = await supabase
    .from('field_requests')
    .select('id')
    .eq('field_id', fieldId)
    .eq('solicitante_id', user.id)
    .eq('status', 'pendiente')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!pendingOwn) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 403 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const solicitante_nombre = body.solicitante_nombre?.trim() || 'Un jugador'
  const solicitante_alias = body.solicitante_alias?.trim() || ''
  const field_nombre = body.field_nombre?.trim() || 'tu campo'
  const fechaTxt = formatFechaParaCorreo(body.fecha_deseada)
  const num =
    typeof body.num_jugadores === 'number' && Number.isFinite(body.num_jugadores)
      ? body.num_jugadores
      : 0
  const mensaje = body.mensaje?.trim()

  const { data: fieldRow, error: fieldErr } = await supabase
    .from('fields')
    .select('created_by')
    .eq('id', fieldId)
    .maybeSingle()

  if (fieldErr || !fieldRow?.created_by) {
    return NextResponse.json({ error: 'Campo no encontrado' }, { status: 404 })
  }

  const ownerId = fieldRow.created_by as string

  const { data: owner, error: ownerErr } = await supabase
    .from('users')
    .select('email, nombre')
    .eq('id', ownerId)
    .maybeSingle()

  if (ownerErr) {
    return NextResponse.json({ error: 'No se pudo cargar el dueño' }, { status: 500 })
  }

  const to = owner?.email?.trim()
  if (!to) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: 'sin email del dueño' },
      { status: 200 }
    )
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: 'RESEND_API_KEY no configurada' },
      { status: 200 }
    )
  }

  const aliasPart = solicitante_alias
    ? ` (@${solicitante_alias})`
    : ''
  let textBody = `${solicitante_nombre}${aliasPart} quiere usar tu campo ${field_nombre} el ${fechaTxt} para ${num} jugadores.`
  if (mensaje) {
    textBody += `\n\nMensaje: ${mensaje}`
  }
  textBody += `\n\nRevisa la solicitud en: https://airnation.online/mi-campo/${fieldId}`

  const resend = new Resend(apiKey)
  const { error: sendErr } = await resend.emails.send({
    from: 'AirNation <info@airnation.online>',
    to,
    subject: 'Nueva solicitud de campo — AirNation',
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
