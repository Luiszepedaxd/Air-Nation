import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminSupabaseServerClient } from '@/app/admin/supabase-server'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { EventoCard, type EventoCardRow } from './components/EventoCard'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Eventos de Airsoft en México 2026 — Calendario, fechas y boletos | AirNation',
  description:
    'Calendario oficial de eventos de airsoft en México 2026. Fechas, sedes, precios y boletos de los principales eventos milsim, torneos y partidas comunitarias. Wild West, Asalto a Guantánamo, Blood Money, Casta Vanguardia, Código Irene y más.',
  keywords: [
    'eventos airsoft méxico',
    'eventos de airsoft en méxico',
    'calendario airsoft méxico 2026',
    'eventos airsoft 2026',
    'milsim méxico',
    'torneos airsoft méxico',
    'partidas airsoft méxico',
    'eventos airsoft cdmx',
    'eventos airsoft guadalajara',
    'eventos airsoft monterrey',
    'comunidad airsoft méxico',
    'boletos airsoft méxico',
  ],
  alternates: {
    canonical: 'https://www.airnation.online/eventos',
  },
  openGraph: {
    title: 'Eventos de Airsoft en México 2026 | AirNation',
    description:
      'Calendario oficial de eventos de airsoft en México. Fechas, sedes, precios y boletos. Milsim, torneos y partidas comunitarias.',
    url: 'https://www.airnation.online/eventos',
    type: 'website',
    images: [
      {
        url: 'https://www.airnation.online/og-eventos.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
}

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function normalizeFieldsEmbed(raw: unknown): {
  nombre: string | null
  slug: string | null
  ciudad: string | null
  foto_portada_url: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') {
    return { nombre: null, slug: null, ciudad: null, foto_portada_url: null }
  }
  const x = o as Record<string, unknown>
  return {
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    slug: typeof x.slug === 'string' ? x.slug : null,
    ciudad: typeof x.ciudad === 'string' ? x.ciudad : null,
    foto_portada_url:
      typeof x.foto_portada_url === 'string' ? x.foto_portada_url : null,
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
      fields ( nombre, slug, ciudad, foto_portada_url )
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
      field_foto: f.foto_portada_url,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Eventos de Airsoft en México 2026',
            description:
              'Calendario oficial de eventos de airsoft, milsim y partidas comunitarias en México 2026.',
            url: 'https://www.airnation.online/eventos',
            numberOfItems: eventos.length,
            itemListElement: eventos.map((e, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              item: {
                '@type': 'Event',
                name: e.title,
                startDate: e.fecha,
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                url: `https://www.airnation.online/eventos/${e.id}`,
                ...(e.imagen_url || e.field_foto
                  ? { image: e.imagen_url ?? e.field_foto ?? undefined }
                  : {}),
                location: {
                  '@type': 'Place',
                  name: e.field_nombre ?? 'Por confirmar',
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: e.ciudad ?? '',
                    addressCountry: 'MX',
                  },
                },
                organizer: {
                  '@type': 'Organization',
                  name: 'AirNation',
                  url: 'https://www.airnation.online',
                },
              },
            })),
          }),
        }}
      />
      <header className="bg-[#111111] px-4 py-10 md:py-14">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 md:flex-row md:items-end md:justify-between md:px-6">
          <div className="max-w-3xl">
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#CC4B37]"
              style={{ ...jost, fontWeight: 800 }}
            >
              CALENDARIO 2026
            </p>
            <h1
              className="mt-3 text-3xl font-extrabold uppercase leading-tight text-white md:text-4xl"
              style={{ ...jost, fontWeight: 800 }}
            >
              Eventos de Airsoft en México
            </h1>
            <p
              className="mt-4 text-sm leading-relaxed text-[#CCCCCC] md:text-base"
              style={lato}
            >
              Calendario oficial de los eventos de airsoft, milsim y partidas comunitarias más relevantes del país. Fechas confirmadas, sedes, precios y enlaces directos a boletos. Si organizas un evento, publícalo gratis. Si vas como jugador, haz RSVP, conecta con tu equipo y prepara tu participación.
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
