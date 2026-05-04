import { notFound, redirect } from 'next/navigation'
import { EventoForm, type FieldOption } from '../../EventoForm'
import { getSupabaseForEventosModule } from '../../eventos-supabase'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminEventoEditarPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id?.trim()
  if (!id) notFound()

  const ctx = await getSupabaseForEventosModule()
  if ('error' in ctx) redirect('/dashboard')

  const { data: ev, error: evErr } = await ctx.supabase
    .from('events')
    .select(
      `
      id,
      title,
      descripcion,
      field_id,
      fecha,
      cupo,
      disciplina,
      tipo,
      imagen_url,
      url_externa,
      sede_nombre,
      sede_ciudad,
      published,
      status,
      organizador_id,
      organizador:users!organizador_id ( id, nombre, alias )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (evErr || !ev) notFound()

  let q = ctx.supabase
    .from('fields')
    .select('id, nombre, ciudad')
    .eq('status', 'aprobado')
    .order('nombre', { ascending: true })

  if (ctx.role === 'field_owner') {
    q = q.eq('created_by', ctx.userId)
  }

  const { data: fieldRows, error: fErr } = await q
  const fieldsOptions: FieldOption[] =
    !fErr && fieldRows ? (fieldRows as FieldOption[]) : []

  const row = ev as Record<string, unknown>
  const orgRaw = row.organizador as unknown
  const orgObj = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw
  let organizador_display: string | null = null
  if (orgObj && typeof orgObj === 'object') {
    const o = orgObj as Record<string, unknown>
    const a = typeof o.alias === 'string' ? o.alias.trim() : ''
    const n = typeof o.nombre === 'string' ? o.nombre.trim() : ''
    organizador_display = a || n || null
  }

  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        EDITAR EVENTO
      </h1>
      <EventoForm
        mode="edit"
        actor={ctx.role}
        fieldsOptions={fieldsOptions}
        initial={{
          id: String(row.id),
          title: String(row.title ?? ''),
          descripcion: (row.descripcion as string | null) ?? null,
          field_id: (row.field_id as string | null) ?? null,
          fecha: String(row.fecha ?? ''),
          cupo: Number(row.cupo ?? 0),
          disciplina: (row.disciplina as string | null) ?? null,
          tipo: (row.tipo as string | null) ?? null,
          imagen_url: (row.imagen_url as string | null) ?? null,
          url_externa: (row.url_externa as string | null) ?? null,
          sede_nombre: (row.sede_nombre as string | null) ?? null,
          sede_ciudad: (row.sede_ciudad as string | null) ?? null,
          published: Boolean(row.published),
          status: String(row.status ?? ''),
          organizador_id: (row.organizador_id as string | null) ?? null,
          organizador_display,
        }}
      />
    </div>
  )
}
