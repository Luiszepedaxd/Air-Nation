import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import PublicSiteHeader from '@/components/layout/PublicSiteHeader'
import { formatEventoFechaCorta } from '../lib/format-evento-fecha'
import { EventoHero } from './components/EventoHero'
import { EventoInfo } from './components/EventoInfo'

export const revalidate = 0

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

function normalizeOrganizador(raw: unknown): {
  id: string | null
  nombre: string | null
  alias: string | null
  avatar_url: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') {
    return { id: null, nombre: null, alias: null, avatar_url: null }
  }
  const x = o as Record<string, unknown>
  return {
    id: typeof x.id === 'string' ? x.id : null,
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    alias: typeof x.alias === 'string' ? x.alias : null,
    avatar_url: typeof x.avatar_url === 'string' ? x.avatar_url : null,
  }
}

type EventDetailRow = {
  id: string
  title: string
  descripcion: string | null
  field_id: string | null
  fecha: string
  cupo: number
  disciplina: string | null
  imagen_url: string | null
  tipo: string | null
  published: boolean
  organizador_id: string | null
  fields: unknown
  organizador: unknown
}

const getEventoById = cache(async (id: string): Promise<EventDetailRow | null> => {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
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
      imagen_url,
      tipo,
      published,
      organizador_id,
      fields ( nombre, slug, ciudad, foto_portada_url ),
      organizador:users!organizador_id ( id, nombre, alias, avatar_url )
    `
    )
    .eq('id', id)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    console.error('[eventos/id]', error.message, error.details, error.hint)
    return null
  }
  if (!data) return null
  return data as unknown as EventDetailRow
})

async function fetchRsvpCount(eventId: string): Promise<number> {
  const supabase = createPublicSupabaseClient()
  const { count, error } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
  if (error) {
    console.error('[eventos/id] rsvp count', error.message)
    return 0
  }
  return count ?? 0
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const id = params.id?.trim()
  if (!id) return { title: 'Evento — AirNation' }

  const row = await getEventoById(id)
  if (!row) return { title: 'Evento — AirNation' }

  const fMeta = normalizeFieldsEmbed(row.fields)
  const imagenOg =
    row.imagen_url?.trim() || fMeta.foto_portada_url?.trim() || null

  const fechaTxt = formatEventoFechaCorta(row.fecha)
  const desc =
    row.descripcion?.trim() ||
    `Evento de airsoft${fechaTxt ? ` el ${fechaTxt}` : ''} — AirNation`

  return {
    title: `${row.title} — Airsoft en ${fMeta.ciudad ?? 'México'} | AirNation`,
    description: desc.slice(0, 160),
    alternates: {
      canonical: `https://airnation.online/eventos/${id}`,
    },
    openGraph: {
      title: `${row.title} — Airsoft en ${fMeta.ciudad ?? 'México'} | AirNation`,
      description: desc.slice(0, 160),
      url: `https://airnation.online/eventos/${id}`,
      type: 'website',
      images: imagenOg
        ? [{ url: imagenOg, width: 1200, height: 630 }]
        : [{ url: 'https://airnation.online/og-default.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function EventoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id?.trim()
  if (!id) notFound()

  const row = await getEventoById(id)
  if (!row) notFound()

  const f = normalizeFieldsEmbed(row.fields)
  const heroImagen =
    row.imagen_url?.trim() || f.foto_portada_url?.trim() || null
  const org = normalizeOrganizador(row.organizador)
  const rsvpCount = await fetchRsvpCount(id)

  const dash = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await dash.auth.getUser()

  let userHasRsvp = false
  if (user) {
    const { data: rsvpRow } = await dash
      .from('event_rsvps')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    userHasRsvp = !!rsvpRow
  }

  const orgId = org.id ?? row.organizador_id

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: row.title,
            startDate: row.fecha,
            description: row.descripcion ?? undefined,
            url: `https://airnation.online/eventos/${id}`,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            ...(heroImagen ? { image: heroImagen } : {}),
            location: f.nombre
              ? {
                  '@type': 'Place',
                  name: f.nombre,
                  ...(f.slug
                    ? { url: `https://airnation.online/campos/${f.slug}` }
                    : {}),
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: f.ciudad ?? '',
                    addressCountry: 'MX',
                  },
                }
              : {
                  '@type': 'Place',
                  address: {
                    '@type': 'PostalAddress',
                    addressCountry: 'MX',
                  },
                },
            organizer: {
              '@type': 'Organization',
              name: 'AirNation',
              url: 'https://airnation.online',
            },
          }),
        }}
      />
      <EventoHero
        title={row.title}
        fecha={row.fecha}
        imagen_url={heroImagen}
        tipo={row.tipo}
        disciplina={row.disciplina}
      />
      <EventoInfo
        eventId={id}
        descripcion={row.descripcion}
        disciplina={row.disciplina}
        fecha={row.fecha}
        field_nombre={f.nombre}
        field_slug={f.slug}
        ciudad={f.ciudad}
        cupo={Number(row.cupo ?? 0)}
        rsvpCount={rsvpCount}
        organizador_id={orgId}
        organizador_nombre={org.nombre}
        organizador_alias={org.alias}
        organizador_avatar_url={org.avatar_url}
        sessionUserId={user?.id ?? null}
        userHasRsvp={userHasRsvp}
      />
    </div>
  )
}
