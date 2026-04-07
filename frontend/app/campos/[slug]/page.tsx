import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import PublicSiteHeader from '@/components/layout/PublicSiteHeader'
import type { CampoDetailRow, FieldReviewPublic } from '../types'
import { CampoHero } from './components/CampoHero'
import type { CampoEventoListItem } from './components/CampoPublicTabs'
import { CampoPublicTabs } from './components/CampoPublicTabs'

export const revalidate = 0

function normalizeTeamEmbed(
  teams: unknown
): CampoDetailRow['teams'] {
  if (!teams) return null
  if (Array.isArray(teams)) {
    const t = teams[0]
    if (!t || typeof t !== 'object') return null
    const o = t as { nombre?: string; slug?: string; logo_url?: string | null }
    return {
      nombre: String(o.nombre ?? ''),
      slug: String(o.slug ?? ''),
      logo_url: o.logo_url ?? null,
    }
  }
  if (typeof teams === 'object') {
    const o = teams as { nombre?: string; slug?: string; logo_url?: string | null }
    return {
      nombre: String(o.nombre ?? ''),
      slug: String(o.slug ?? ''),
      logo_url: o.logo_url ?? null,
    }
  }
  return null
}

const getCampoBySlug = cache(async (slug: string): Promise<CampoDetailRow | null> => {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('fields')
    .select(
      `
      id,
      nombre,
      slug,
      ciudad,
      tipo,
      foto_portada_url,
      logo_url,
      promedio_rating,
      destacado,
      orden_destacado,
      descripcion,
      horarios_json,
      telefono,
      instagram,
      direccion,
      maps_url,
      team_id,
      status,
      galeria_urls,
      teams ( nombre, slug, logo_url )
    `
    )
    .eq('slug', slug)
    .eq('status', 'aprobado')
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[campos/slug] field:', error.message)
    return null
  }

  const d = data as unknown as Record<string, unknown>
  const teamsRaw = d.teams
  const { teams: _drop, galeria_urls: galRaw, ...rest } = d
  void _drop
  const galeria_urls = Array.isArray(galRaw)
    ? galRaw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : null
  return {
    ...rest,
    galeria_urls: galeria_urls && galeria_urls.length > 0 ? galeria_urls : null,
    teams: normalizeTeamEmbed(teamsRaw),
  } as CampoDetailRow
})

async function fetchReviews(fieldId: string): Promise<FieldReviewPublic[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('field_reviews')
    .select(
      `
      user_id,
      rating,
      comentario,
      created_at,
      users ( nombre, alias, avatar_url )
    `
    )
    .eq('field_id', fieldId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[campos/slug] reviews:', error.message)
    return []
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  return rows.map((r) => {
    const uRaw = r.users
    const uSingle = Array.isArray(uRaw) ? uRaw[0] : uRaw
    const u =
      uSingle && typeof uSingle === 'object'
        ? {
            nombre: (uSingle as { nombre?: string | null }).nombre ?? null,
            alias: (uSingle as { alias?: string | null }).alias ?? null,
            avatar_url:
              (uSingle as { avatar_url?: string | null }).avatar_url ?? null,
          }
        : null
    return {
      user_id: String(r.user_id ?? ''),
      rating: Number(r.rating ?? 0),
      comentario: (r.comentario as string | null) ?? null,
      created_at: String(r.created_at ?? ''),
      users: u,
    } satisfies FieldReviewPublic
  })
}

async function fetchEventosCampo(fieldId: string): Promise<CampoEventoListItem[]> {
  const supabase = createPublicSupabaseClient()
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('events')
    .select('id, title, fecha, cupo, imagen_url')
    .eq('field_id', fieldId)
    .eq('published', true)
    .eq('status', 'publicado')
    .gte('fecha', nowIso)
    .order('fecha', { ascending: true })

  if (error) {
    console.error('[campos/slug] eventos:', error.message)
    return []
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  return rows.map((r) => ({
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    fecha: String(r.fecha ?? ''),
    cupo: Number(r.cupo ?? 0),
    imagen_url: (r.imagen_url as string | null) ?? null,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const field = await getCampoBySlug(params.slug)
  if (!field) {
    return { title: 'Campo — AirNation' }
  }
  const desc =
    field.descripcion?.trim() ||
    `Campo de airsoft en ${field.ciudad || 'México'} — AirNation`

  return {
    title: `${field.nombre} — Campo de Airsoft en ${field.ciudad ?? 'México'} | AirNation`,
    description: desc,
    alternates: {
      canonical: `https://airnation.online/campos/${field.slug}`,
    },
    openGraph: {
      title: `${field.nombre} — Campo de Airsoft en ${field.ciudad ?? 'México'} | AirNation`,
      description: desc,
      url: `https://airnation.online/campos/${field.slug}`,
      type: 'website',
      images: field.foto_portada_url
        ? [{ url: field.foto_portada_url, width: 1200, height: 630 }]
        : [{ url: 'https://airnation.online/og-default.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function CampoPublicPage({
  params,
}: {
  params: { slug: string }
}) {
  const field = await getCampoBySlug(params.slug)
  if (!field) notFound()

  const [initialReviews, eventos] = await Promise.all([
    fetchReviews(field.id),
    fetchEventosCampo(field.id),
  ])

  const supabaseAuth = createDashboardSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabaseAuth.auth.getUser()

  let solicitanteNombre: string | null = null
  let solicitanteAlias: string | null = null
  if (authUser?.id) {
    const { data: perfil } = await supabaseAuth
      .from('users')
      .select('nombre, alias')
      .eq('id', authUser.id)
      .maybeSingle()
    solicitanteNombre = (perfil?.nombre as string | null) ?? null
    solicitanteAlias = (perfil?.alias as string | null) ?? null
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsActivityLocation',
            name: field.nombre,
            url: `https://airnation.online/campos/${field.slug}`,
            description: field.descripcion ?? undefined,
            ...(field.foto_portada_url ? { image: field.foto_portada_url } : {}),
            ...(field.telefono ? { telephone: field.telefono } : {}),
            address: {
              '@type': 'PostalAddress',
              addressLocality: field.ciudad ?? '',
              addressCountry: 'MX',
            },
            ...(function () {
              const f = field as CampoDetailRow & {
                ubicacion_lat?: number | null
                ubicacion_lng?: number | null
              }
              return f.ubicacion_lat && f.ubicacion_lng
                ? {
                    geo: {
                      '@type': 'GeoCoordinates',
                      latitude: f.ubicacion_lat,
                      longitude: f.ubicacion_lng,
                    },
                  }
                : {}
            })(),
            ...(field.promedio_rating && Number(field.promedio_rating) > 0
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: Number(field.promedio_rating).toFixed(1),
                    bestRating: '5',
                    worstRating: '1',
                  },
                }
              : {}),
          }),
        }}
      />
      <CampoHero field={field} />
      <CampoPublicTabs
        field={field}
        fieldSlug={params.slug}
        currentUserId={authUser?.id ?? null}
        solicitanteNombre={solicitanteNombre}
        solicitanteAlias={solicitanteAlias}
        initialReviews={initialReviews}
        eventos={eventos}
      />
    </div>
  )
}
