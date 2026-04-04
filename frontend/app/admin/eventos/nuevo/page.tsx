import { redirect } from 'next/navigation'
import { EventoForm } from '../EventoForm'
import type { FieldOption } from '../EventoForm'
import { getSupabaseForEventosModule } from '../eventos-supabase'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminEventoNuevoPage({
  searchParams,
}: {
  searchParams: { field_id?: string }
}) {
  const ctx = await getSupabaseForEventosModule()
  if ('error' in ctx) redirect('/dashboard')

  let q = ctx.supabase
    .from('fields')
    .select('id, nombre, ciudad')
    .eq('status', 'aprobado')
    .order('nombre', { ascending: true })

  if (ctx.role === 'field_owner') {
    q = q.eq('created_by', ctx.userId)
  }

  const { data: fieldRows, error } = await q
  const fieldsOptions: FieldOption[] =
    !error && fieldRows
      ? (fieldRows as FieldOption[])
      : []

  const defaultFieldId = searchParams.field_id?.trim() || null

  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        NUEVO EVENTO
      </h1>
      <EventoForm
        mode="create"
        actor={ctx.role}
        fieldsOptions={fieldsOptions}
        defaultFieldId={defaultFieldId}
      />
    </div>
  )
}
