import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminSupabaseServerClient } from '@/app/admin/supabase-server'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { EventoCard, type EventoCardRow } from './components/EventoCard'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Eventos — AirNation',
  description: 'Partidas y eventos de la comunidad de airsoft.',
}

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function normalizeFieldsEmbed(raw: unknown): {
  nombre: string | null
  slug: string | null
  ciudad: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') {
    return { nombre: null, slug: null, ciudad: null }
  }
  const x = o as Record<string, unknown>
  return {
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    slug: typeof x.slug === 'string' ? x.slug : null,
    ciudad: typeof x.ciudad === 'string' ? x.ciudad : null,
  }
}

async function fetchEventos(): Promise<EventoCardRow[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      fecha,
      cupo,
      disciplina,
      imagen_url,
      tipo,
      fields ( nombre, slug, ciudad )
    `
    )
    .eq('published', true)
    .eq('status', 'publicado')
    .order('fecha', { ascending: true })

  if (error) {
    console.error('[eventos] list:', error.message)
    return []
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  const ids = rows.map((r) => String(r.id)).filter(Boolean)

  const countMap = new Map<string, number>()
  if (ids.length > 0) {
    const { data: batch, error: batchErr } = await supabase.rpc(
      'event_rsvp_counts_batch',
      { p_event_ids: ids }
    )
    if (!batchErr && Array.isArray(batch)) {
      for (const row of batch as { event_id: string; total: number }[]) {
        if (row?.event_id != null) countMap.set(String(row.event_id), row.total)
      }
    }
  }

  return rows.map((r) => {
    const f = normalizeFieldsEmbed(r.fields)
    const id = String(r.id)
    return {
      id,
      title: String(r.title ?? ''),
      fecha: String(r.fecha ?? ''),
      cupo: Number(r.cupo ?? 0),
      disciplina: (r.disciplina as string | null) ?? null,
      imagen_url: (r.imagen_url as string | null) ?? null,
      tipo: (r.tipo as string | null) ?? null,
      field_nombre: f.nombre,
      field_slug: f.slug,
      ciudad: f.ciudad,
      rsvp_count: countMap.get(id) ?? 0,
    }
  })
}

export default async function EventosPage() {
  const eventos = await fetchEventos()
  const userSb = createAdminSupabaseServerClient()
  const {
    data: { session },
  } = await userSb.auth.getSession()

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 md:flex-row md:items-end md:justify-between md:px-6">
          <div>
            <h1
              className="text-2xl font-extrabold uppercase leading-tight text-white"
              style={{ ...jost, fontWeight: 800 }}
            >
              EVENTOS
            </h1>
            <p
              className="mt-2 text-sm text-[#999999]"
              style={lato}
            >
              Partidas y eventos de la comunidad
            </p>
          </div>
          {session ? (
            <Link
              href="/eventos/nuevo"
              className="inline-flex shrink-0 items-center justify-center border border-solid border-[#FFFFFF]/30 bg-[#CC4B37] px-5 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-opacity hover:opacity-90"
              style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
            >
              CREAR EVENTO
            </Link>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        {eventos.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#666666]" style={lato}>
            No hay eventos publicados por ahora.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((e) => (
              <EventoCard key={e.id} evento={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
