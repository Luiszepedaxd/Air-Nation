import type { Metadata } from 'next'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { MarketplaceExploreClient } from './MarketplaceExploreClient'
import type { PublicMarketplaceListing } from './types'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Marketplace de airsoft en México — AirNation',
  description:
    'Compra y vende réplicas de airsoft en México. Marketplace P2P con equipos nuevos y usados.',
  alternates: {
    canonical: 'https://airnation.online/marketplace',
  },
}

async function fetchMarketplaceActivos(): Promise<PublicMarketplaceListing[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('marketplace')
    .select(
      'id, titulo, precio, precio_original, modalidad, supercategoria, fotos_urls, ciudad, estado, status, vendido, created_at, nuevo_usado'
    )
    .eq('status', 'activo')
    .eq('vendido', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[marketplace] list:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const modalidadRaw = r.modalidad
    const modalidad: 'fijo' | 'desde' =
      modalidadRaw === 'desde' ? 'desde' : 'fijo'
    return {
      id: String(r.id ?? ''),
      titulo: String(r.titulo ?? ''),
      precio: r.precio != null ? Number(r.precio) : null,
      precio_original: r.precio_original != null ? Number(r.precio_original) : null,
      modalidad,
      supercategoria: r.supercategoria != null ? String(r.supercategoria) : null,
      fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : [],
      ciudad: r.ciudad != null ? String(r.ciudad) : null,
      estado: r.estado != null ? String(r.estado) : null,
      status: String(r.status ?? ''),
      vendido: Boolean(r.vendido),
      nuevo_usado: String(r.nuevo_usado ?? 'usado'),
      created_at: String(r.created_at ?? ''),
    }
  })
}

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

export default async function MarketplacePage() {
  const listings = await fetchMarketplaceActivos()

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] md:px-6">
          <h1
            className="text-2xl font-extrabold uppercase leading-tight text-white"
            style={jost}
          >
            Marketplace de airsoft
          </h1>
          <p className="mt-2 text-sm text-[#999999]" style={lato}>
            Compra y vende réplicas en México
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <MarketplaceExploreClient listings={listings} />
      </div>
    </div>
  )
}
