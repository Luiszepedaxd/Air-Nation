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
      published,
      status
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
          published: Boolean(row.published),
          status: String(row.status ?? ''),
        }}
      />
    </div>
  )
}
