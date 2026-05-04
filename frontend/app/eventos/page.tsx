import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminSupabaseServerClient } from '@/app/admin/supabase-server'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { getSiteAssets } from '@/lib/site-assets'
import type { EventoCardRow } from './components/EventoCard'
import { EventosPorQue, EventosCTASecundario } from './components/EventosPorQue'
import { EventosFiltros } from './components/EventosFiltros'

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
  const nowIso = new Date().toISOString()
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
      sede_nombre,
      sede_ciudad,
      cupo_vendido_creador,
      fields ( nombre, slug, ciudad, foto_portada_url )
    `
    )
    .eq('published', true)
    .eq('status', 'publicado')
    .gte('fecha', nowIso)
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
      sede_nombre: (r.sede_nombre as string | null) ?? null,
      sede_ciudad: (r.sede_ciudad as string | null) ?? null,
      cupo_vendido_creador: (r.cupo_vendido_creador as number | null) ?? null,
    }
  })
}

export default async function EventosPage() {
  const eventos = await fetchEventos()
  const userSb = createAdminSupabaseServerClient()
  const {
    data: { session },
  } = await userSb.auth.getSession()
  const assets = await getSiteAssets()
  const heroBgUrl = assets['eventos_hero_background'] ?? null

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
                  name: e.field_nombre ?? e.sede_nombre ?? 'Por confirmar',
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: e.ciudad ?? e.sede_ciudad ?? '',
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
      <section className="relative flex min-h-[420px] flex-col justify-center overflow-hidden bg-[#111111] md:min-h-[480px]">
        {heroBgUrl ? (
          <img
            src={heroBgUrl}
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
          />
        ) : null}

        {/* Overlay 1: oscuro intenso solo en el lado izquierdo donde monta el texto, transparente en el lado derecho */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#111111] via-[#111111]/70 to-transparent"
          aria-hidden
        />

        {/* Overlay 2: oscurecimiento sutil global solo para mantener contraste */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[#111111]/20"
          aria-hidden
        />

        {/* Overlay 3: fade inferior sutil para transición al grid */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-[#111111]/50 to-transparent"
          aria-hidden
        />

        {/* Contenido */}
        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-5 py-12 sm:px-8 md:px-6 md:py-16">
          <div className="max-w-[640px]">
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#CC4B37]"
              style={{ ...jost, fontWeight: 800 }}
            >
              CALENDARIO 2026
            </p>

            <h1
              className="mt-4 font-extrabold uppercase leading-[1.02] text-white"
              style={{ ...jost, fontWeight: 800, fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}
            >
              Eventos de Airsoft en México
            </h1>

            <p
              className="mt-5 max-w-[480px] text-[14px] leading-relaxed text-white/70 md:text-[15px]"
              style={lato}
            >
              Calendario oficial de eventos milsim, torneos y partidas comunitarias del país.
            </p>

            {/* CTAs condicionales según sesión */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {session ? (
                <>
                  <Link
                    href="/eventos/nuevo"
                    className="inline-flex items-center justify-center gap-2 bg-[#CC4B37] px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
                    style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
                  >
                    CREAR EVENTO
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/dashboard/perfil"
                    className="inline-flex items-center justify-center border border-solid border-white/35 px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/90 transition-colors hover:border-white hover:text-white"
                    style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
                  >
                    MI AGENDA
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 bg-[#CC4B37] px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
                    style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
                  >
                    CREAR CUENTA GRATIS
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center border border-solid border-white/35 px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/90 transition-colors hover:border-white hover:text-white"
                    style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
                  >
                    INICIAR SESIÓN
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <EventosFiltros eventos={eventos} />
      <EventosPorQue />
      <EventosCTASecundario hasSession={!!session} />
    </div>
  )
}
