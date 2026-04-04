import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import type { CampoDetailRow, FieldReviewPublic } from '../types'
import { CampoHero } from './components/CampoHero'
import { CampoInfo } from './components/CampoInfo'
import { CampoReviews } from './components/CampoReviews'

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
      disciplinas,
      promedio_rating,
      destacado,
      orden_destacado,
      descripcion,
      horarios,
      telefono,
      instagram,
      ubicacion_lat,
      ubicacion_lng,
      team_id,
      status,
      teams ( nombre, slug, logo_url )
    `
    )
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[campos/slug] field:', error.message)
    return null
  }

  const d = data as unknown as Record<string, unknown>
  const teamsRaw = d.teams
  const { teams: _drop, ...rest } = d
  void _drop
  return {
    ...rest,
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
    title: `${field.nombre} — AirNation`,
    description: desc,
    openGraph: {
      title: `${field.nombre} — AirNation`,
      description: desc,
      images: field.foto_portada_url ? [{ url: field.foto_portada_url }] : [],
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

  const initialReviews = await fetchReviews(field.id)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <CampoHero field={field} />
      <div className="mx-auto max-w-[960px] space-y-6 px-4 py-6 md:px-6 md:py-8">
        <CampoInfo field={field} />
        <CampoReviews
          fieldId={field.id}
          slug={params.slug}
          initialReviews={initialReviews}
        />
      </div>
    </div>
  )
}
