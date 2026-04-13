import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import PublicSiteHeader from '@/components/layout/PublicSiteHeader'
import { ReplicaPublicClient } from './ReplicaPublicClient'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'

export const revalidate = 0

const BASE = 'https://airnation.online'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const supabase = createPublicSupabaseClient()
  const { data } = await supabase
    .from('arsenal')
    .select('nombre, sistema, mecanismo, ciudad, estado, foto_url, descripcion')
    .eq('id', params.id)
    .maybeSingle()

  if (!data) return { title: 'Réplica — AirNation' }

  const descParts = [`${data.nombre} en AirNation`]
  if (data.sistema) descParts.push(data.sistema)
  if (data.mecanismo) descParts.push(data.mecanismo)
  if (data.ciudad) descParts.push(data.ciudad)

  const ogImage = data.foto_url?.trim()
    ? data.foto_url
    : `${BASE}/og-default.jpg`

  return {
    title: `${data.nombre} — AirNation`,
    description: descParts.join(' · '),
    alternates: {
      canonical: `${BASE}/replicas/${params.id}`,
    },
    openGraph: {
      title: `${data.nombre} — AirNation`,
      description: descParts.join(' · '),
      url: `${BASE}/replicas/${params.id}`,
      siteName: 'AirNation',
      images: [{ url: ogImage, width: 800, height: 450, alt: data.nombre }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.nombre} — AirNation`,
      description: descParts.join(' · '),
      images: [ogImage],
    },
  }
}

export default async function ReplicaPublicPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createPublicSupabaseClient()

  const { data: replica } = await supabase
    .from('arsenal')
    .select(`
      id, nombre, sistema, mecanismo, condicion, upgrades,
      foto_url, descripcion, ciudad, estado, verificada,
      en_venta, serial, user_id, created_at,
      users ( id, alias, nombre, avatar_url )
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!replica) notFound()

  const supabaseAuth = createDashboardSupabaseServerClient()
  const { data: { user: currentUser } } = await supabaseAuth.auth.getUser()

  const r = replica as Record<string, unknown>
  const u = Array.isArray(r.users) ? r.users[0] : r.users
  const uo = (u ?? {}) as Record<string, unknown>

  const owner = {
    id: String(uo.id ?? r.user_id),
    alias: uo.alias ? String(uo.alias) : null,
    nombre: uo.nombre ? String(uo.nombre) : null,
    avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: String(r.nombre),
    description: r.descripcion ? String(r.descripcion) : undefined,
    image: r.foto_url ? String(r.foto_url) : undefined,
    url: `${BASE}/replicas/${params.id}`,
    brand: {
      '@type': 'Brand',
      name: 'AirNation Arsenal',
    },
    additionalProperty: [
      r.sistema ? { '@type': 'PropertyValue', name: 'Sistema', value: String(r.sistema) } : null,
      r.mecanismo ? { '@type': 'PropertyValue', name: 'Mecanismo', value: String(r.mecanismo) } : null,
      r.condicion ? { '@type': 'PropertyValue', name: 'Condición', value: String(r.condicion) } : null,
      r.serial ? { '@type': 'PropertyValue', name: 'Serial', value: String(r.serial) } : null,
    ].filter(Boolean),
  }

  return (
    <>
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReplicaPublicClient
        replica={{
          id: String(r.id),
          nombre: String(r.nombre),
          sistema: r.sistema ? String(r.sistema) : null,
          mecanismo: r.mecanismo ? String(r.mecanismo) : null,
          condicion: r.condicion ? String(r.condicion) : null,
          upgrades: r.upgrades ? String(r.upgrades) : null,
          foto_url: r.foto_url ? String(r.foto_url) : null,
          descripcion: r.descripcion ? String(r.descripcion) : null,
          ciudad: r.ciudad ? String(r.ciudad) : null,
          estado: r.estado ? String(r.estado) : null,
          verificada: Boolean(r.verificada),
          en_venta: Boolean(r.en_venta),
          serial: r.serial ? String(r.serial) : null,
          created_at: String(r.created_at),
        }}
        owner={owner}
        currentUserId={currentUser?.id ?? null}
        currentUserAlias={currentUser?.user_metadata?.alias ?? null}
        currentUserAvatar={currentUser?.user_metadata?.avatar_url ?? null}
      />
    </>
  )
}
