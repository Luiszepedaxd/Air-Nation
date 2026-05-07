import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { EventoHomeCard, type EventoHomeRow } from './EventoHomeCard'

function normalizeFieldsEmbed(raw: unknown): {
  nombre: string | null
  ciudad: string | null
  foto_portada_url: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') {
    return { nombre: null, ciudad: null, foto_portada_url: null }
  }
  const x = o as Record<string, unknown>
  return {
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    ciudad: typeof x.ciudad === 'string' ? x.ciudad : null,
    foto_portada_url:
      typeof x.foto_portada_url === 'string' ? x.foto_portada_url : null,
  }
}

async function fetchProximosEventos(): Promise<EventoHomeRow[]> {
  const supabase = createPublicSupabaseClient()
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      fecha,
      cupo,
      imagen_url,
      sede_nombre,
      sede_ciudad,
      cupo_vendido_creador,
      fields ( nombre, ciudad, foto_portada_url )
    `
    )
    .eq('published', true)
    .eq('status', 'publicado')
    .gte('fecha', nowIso)
    .order('fecha', { ascending: true })
    .limit(3)

  if (error) {
    console.error('[home/eventos] list:', error.message)
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
      imagen_url: (r.imagen_url as string | null) ?? null,
      field_foto: f.foto_portada_url,
      field_nombre: f.nombre,
      ciudad: f.ciudad,
      sede_nombre: (r.sede_nombre as string | null) ?? null,
      sede_ciudad: (r.sede_ciudad as string | null) ?? null,
      cupo_vendido_creador: (r.cupo_vendido_creador as number | null) ?? null,
      rsvp_count: countMap.get(id) ?? 0,
    }
  })
}

export default async function ProximosEventosHome() {
  const eventos = await fetchProximosEventos()

  if (eventos.length === 0) return null

  return (
    <section
      id="proximos-eventos"
      className="relative bg-[#F4F4F4] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="mb-6 flex flex-col gap-6 sm:mb-10 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Calendario 2026
                </p>
              </div>
              <h2
                className="font-display font-black uppercase leading-[0.9] text-[#111111]"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}
              >
                LO QUE SE
                <br />
                VIENE EN
                <br />
                <span className="text-[#CC4B37]">EL CAMPO.</span>
              </h2>
              <p className="mt-6 font-body text-base leading-[1.7] text-[#666666] sm:text-[1.05rem]">
                Domingueras, milsim y torneos próximos en México. Todo en un
                solo lugar.
              </p>
            </div>
            <Link
              href="/eventos"
              className="group inline-flex shrink-0 items-center gap-2 self-start font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37] hover:text-[#CC4B37]/80 lg:self-end"
            >
              Ver todos los eventos
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </RevealOnScroll>

        {/* Mobile: carrusel horizontal centrado */}
        <div className="-mx-5 sm:hidden">
          <div
            className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingLeft: '1.25rem',
              paddingRight: '1.25rem',
              scrollPaddingLeft: '1.25rem',
              scrollPaddingRight: '1.25rem',
            }}
          >
            {eventos.map((e, i) => (
              <div
                key={e.id}
                className={`h-[360px] w-[82%] shrink-0 snap-start ${
                  i === eventos.length - 1 ? 'pr-5' : ''
                }`}
                style={{
                  scrollSnapAlign:
                    i === 0
                      ? 'start'
                      : i === eventos.length - 1
                        ? 'end'
                        : 'start',
                }}
              >
                <EventoHomeCard evento={e} index={i} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-1.5 px-5">
            {eventos.map((e) => (
              <span
                key={e.id}
                className="h-1 w-1 rounded-full bg-[#CCCCCC]"
                aria-hidden
              />
            ))}
          </div>
        </div>

        <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {eventos.map((e, i) => (
            <RevealOnScroll
              key={e.id}
              delay={i * 0.1}
              direction="up"
              distance={40}
            >
              <EventoHomeCard evento={e} index={i} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
