import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseForEventosModule } from './eventos-supabase'
import EventosList, { type AdminEventoRow } from './EventosList'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

function normalizeFields(raw: unknown): {
  nombre: string | null
  ciudad: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') return { nombre: null, ciudad: null }
  const x = o as Record<string, unknown>
  return {
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    ciudad: typeof x.ciudad === 'string' ? x.ciudad : null,
  }
}

export default async function AdminEventosPage() {
  const ctx = await getSupabaseForEventosModule()
  if ('error' in ctx) redirect('/dashboard')

  const { data, error } = await ctx.supabase
    .from('events')
    .select(
      `
      id,
      title,
      field_id,
      fecha,
      cupo,
      disciplina,
      tipo,
      published,
      status,
      imagen_url,
      created_at,
      fields ( nombre, ciudad )
    `
    )
    .order('fecha', { ascending: false })

  const rows: AdminEventoRow[] = []
  if (!error && data) {
    for (const r of data as Record<string, unknown>[]) {
      const f = normalizeFields(r.fields)
      rows.push({
        id: String(r.id),
        title: String(r.title ?? ''),
        field_id: (r.field_id as string | null) ?? null,
        fecha: String(r.fecha ?? ''),
        cupo: Number(r.cupo ?? 0),
        disciplina: (r.disciplina as string | null) ?? null,
        tipo: (r.tipo as string | null) ?? null,
        published: Boolean(r.published),
        status: String(r.status ?? ''),
        imagen_url: (r.imagen_url as string | null) ?? null,
        field_nombre: f.nombre,
        field_ciudad: f.ciudad,
      })
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          EVENTOS
        </h1>
        <Link
          href="/admin/eventos/nuevo"
          className="inline-flex items-center justify-center border border-solid border-[#EEEEEE] bg-[#CC4B37] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          NUEVO EVENTO
        </Link>
      </div>
      <EventosList initialRows={rows} />
    </div>
  )
}
