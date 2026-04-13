import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { ListingDetailClient } from './ListingDetailClient'

export const revalidate = 0

const BASE = 'https://www.airnation.online'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createPublicSupabaseClient()
  const { data } = await supabase
    .from('marketplace')
    .select('titulo, precio, modalidad, fotos_urls, ciudad, estado')
    .eq('id', params.id)
    .maybeSingle()

  if (!data) return { title: 'Marketplace — AirNation' }

  const r = data as Record<string, unknown>
  const foto = Array.isArray(r.fotos_urls) && r.fotos_urls.length > 0
    ? String(r.fotos_urls[0])
    : `${BASE}/og-default.jpg`

  const precio = r.precio ? `$${Number(r.precio).toLocaleString('es-MX')}` : ''
  const desc = [precio, r.ciudad ? String(r.ciudad) : null].filter(Boolean).join(' · ')

  return {
    title: `${String(r.titulo)} — AirNation Marketplace`,
    description: desc,
    openGraph: {
      title: `${String(r.titulo)} — AirNation Marketplace`,
      description: desc,
      url: `${BASE}/marketplace/${params.id}`,
      siteName: 'AirNation',
      images: [{ url: foto, width: 800, height: 800, alt: String(r.titulo) }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${String(r.titulo)} — AirNation Marketplace`,
      description: desc,
      images: [foto],
    },
  }
}

export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = createPublicSupabaseClient()

  const { data } = await supabase
    .from('marketplace')
    .select(`
      id, titulo, descripcion, precio, precio_original, modalidad,
      supercategoria, subcategoria, sub_subcategoria,
      mecanismo, condicion_replica, nuevo_usado,
      fotos_urls, ciudad, estado, status, vendido,
      paquetes, replica_id, created_at,
      users!seller_id ( id, alias, nombre, avatar_url )
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!data) notFound()

  const supabaseAuth = createDashboardSupabaseServerClient()
  const { data: { user: currentUser } } = await supabaseAuth.auth.getUser()

  const r = data as Record<string, unknown>
  const u = Array.isArray(r.users) ? r.users[0] : r.users
  const uo = (u ?? {}) as Record<string, unknown>

  const seller = {
    id: String(uo.id ?? ''),
    alias: uo.alias ? String(uo.alias) : null,
    nombre: uo.nombre ? String(uo.nombre) : null,
    avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
  }

  return (
    <ListingDetailClient
      listing={{
        id: String(r.id),
        titulo: String(r.titulo ?? ''),
        descripcion: r.descripcion ? String(r.descripcion) : null,
        precio: r.precio ? Number(r.precio) : null,
        precio_original: r.precio_original ? Number(r.precio_original) : null,
        modalidad: (r.modalidad as 'fijo' | 'desde') ?? 'fijo',
        supercategoria: r.supercategoria ? String(r.supercategoria) : null,
        subcategoria: r.subcategoria ? String(r.subcategoria) : null,
        sub_subcategoria: r.sub_subcategoria ? String(r.sub_subcategoria) : null,
        mecanismo: r.mecanismo ? String(r.mecanismo) : null,
        condicion_replica: r.condicion_replica ? String(r.condicion_replica) : null,
        nuevo_usado: String(r.nuevo_usado ?? 'usado'),
        fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : [],
        ciudad: r.ciudad ? String(r.ciudad) : null,
        estado: r.estado ? String(r.estado) : null,
        status: String(r.status ?? 'activo'),
        vendido: Boolean(r.vendido),
        paquetes: Array.isArray(r.paquetes) ? r.paquetes as { nombre: string; descripcion: string | null; precio: number; orden: number }[] : [],
        replica_id: r.replica_id ? String(r.replica_id) : null,
        created_at: String(r.created_at),
      }}
      seller={seller}
      currentUserId={currentUser?.id ?? null}
      currentUserAlias={currentUser?.user_metadata?.alias ?? null}
      currentUserAvatar={currentUser?.user_metadata?.avatar_url ?? null}
      isOwner={currentUser?.id === seller.id}
    />
  )
}
