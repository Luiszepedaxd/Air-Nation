import { createAdminClient } from '../supabase-server'
import FieldsList, { type FieldListItem } from './FieldsList'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export default async function AdminCamposPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('fields')
    .select(
      'id, nombre, ciudad, status, destacado, orden_destacado, foto_portada_url, created_at'
    )
    .order('created_at', { ascending: false })

  const fields: FieldListItem[] =
    !error && data ? (data as FieldListItem[]) : []

  const pending = fields.filter((f) => f.status === 'pendiente').length
  const approved = fields.filter((f) => f.status === 'aprobado').length
  const rejected = fields.filter((f) => f.status === 'rechazado').length

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          CAMPOS
        </h1>
        <div
          className="flex flex-wrap items-center gap-3 text-sm text-[#666666]"
          style={latoBody}
        >
          <span className="inline-flex items-center gap-2">
            <span style={jostHeading} className="text-[10px] tracking-[0.12em] text-[#111111]">
              PENDIENTES
            </span>
            <span
              className="inline-flex min-w-[1.75rem] items-center justify-center px-2 py-1 text-[11px] font-semibold text-[#FFFFFF]"
              style={{ ...jostHeading, backgroundColor: '#CC4B37', borderRadius: 2 }}
            >
              {pending}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span style={jostHeading} className="text-[10px] tracking-[0.12em] text-[#111111]">
              APROBADOS
            </span>
            <span
              className="inline-flex min-w-[1.75rem] items-center justify-center px-2 py-1 text-[11px] font-semibold text-[#FFFFFF]"
              style={{ ...jostHeading, backgroundColor: '#111111', borderRadius: 2 }}
            >
              {approved}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span style={jostHeading} className="text-[10px] tracking-[0.12em] text-[#111111]">
              RECHAZADOS
            </span>
            <span
              className="inline-flex min-w-[1.75rem] items-center justify-center border border-solid border-[#EEEEEE] px-2 py-1 text-[11px] font-semibold text-[#666666]"
              style={{ ...jostHeading, backgroundColor: '#EEEEEE', borderRadius: 2 }}
            >
              {rejected}
            </span>
          </span>
        </div>
      </div>
      <FieldsList fields={fields} />
    </div>
  )
}
