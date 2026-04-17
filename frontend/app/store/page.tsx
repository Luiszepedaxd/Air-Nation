import type { Metadata } from 'next'
import { ensureAppAdminOrRedirect } from '@/app/admin/require-app-admin'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { StoreExploreClient } from './StoreExploreClient'
import type { EditorialData } from './StoreExploreClient'
import type { StoreBrand, StoreCategory, StoreProduct } from './types'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Store — AirNation',
  description: 'Vista previa admin de la tienda oficial AirNation.',
}

const EDITORIAL_SLUGS = ['hero', 'banner1', 'banner2', 'promoBanner'] as const
type EditorialSlug = (typeof EDITORIAL_SLUGS)[number]

function mapProduct(row: Record<string, unknown>): StoreProduct {
  const condRaw = String(row.condicion ?? 'nuevo').toLowerCase()
  const condicion: 'nuevo' | 'outlet' = condRaw === 'outlet' ? 'outlet' : 'nuevo'
  return {
    id: String(row.id ?? ''),
    nombre: String(row.nombre ?? ''),
    slug: String(row.slug ?? ''),
    fotos_urls: Array.isArray(row.fotos_urls) ? (row.fotos_urls as string[]) : [],
    precio: row.precio != null ? Number(row.precio) : 0,
    condicion,
    stock: row.stock != null ? Number(row.stock) : 0,
    stock_visible: Boolean(row.stock_visible),
    destacado: Boolean(row.destacado),
    activo: Boolean(row.activo),
    brand_id: row.brand_id != null ? String(row.brand_id) : null,
    categoria_id: row.categoria_id != null ? String(row.categoria_id) : null,
  }
}

function mapCategory(row: Record<string, unknown>): StoreCategory {
  return {
    id: String(row.id ?? ''),
    nombre: String(row.nombre ?? ''),
    slug: String(row.slug ?? ''),
    parent_id: row.parent_id != null ? String(row.parent_id) : null,
  }
}

function mapBrand(row: Record<string, unknown>): StoreBrand {
  return {
    id: String(row.id ?? ''),
    nombre: String(row.nombre ?? ''),
    slug: String(row.slug ?? ''),
    logo_url: row.logo_url != null ? String(row.logo_url) : null,
  }
}

async function fetchStoreData(): Promise<{
  products: StoreProduct[]
  categories: StoreCategory[]
  brands: StoreBrand[]
  editorial: Partial<EditorialData>
}> {
  const supabase = createDashboardSupabaseServerClient()

  const [productsRes, categoriesRes, brandsRes, blocksRes] = await Promise.all([
    supabase
      .from('store_products')
      .select(
        'id, nombre, slug, fotos_urls, precio, condicion, stock, stock_visible, destacado, brand_id, categoria_id, activo'
      )
      .eq('activo', true)
      .order('destacado', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('store_categories')
      .select('id, nombre, slug, parent_id')
      .eq('activo', true),
    supabase.from('store_brands').select('id, nombre, slug, logo_url').eq('activo', true),
    supabase
      .from('store_homepage_blocks')
      .select('tipo, config')
      .in('tipo', EDITORIAL_SLUGS as unknown as string[]),
  ])

  if (productsRes.error) {
    console.error('[store] products:', productsRes.error.message)
  }
  if (categoriesRes.error) {
    console.error('[store] categories:', categoriesRes.error.message)
  }
  if (brandsRes.error) {
    console.error('[store] brands:', brandsRes.error.message)
  }
  if (blocksRes.error) {
    console.error('[store] blocks:', blocksRes.error.message)
  }

  const products = (productsRes.data ?? []).map((row) =>
    mapProduct(row as Record<string, unknown>)
  )
  const categories = (categoriesRes.data ?? []).map((row) =>
    mapCategory(row as Record<string, unknown>)
  )
  const brands = (brandsRes.data ?? []).map((row) => mapBrand(row as Record<string, unknown>))

  const editorial: Partial<EditorialData> = {}
  const rows = (blocksRes.data ?? []) as { tipo: string; config: unknown }[]
  for (const row of rows) {
    const slug = row.tipo
    if ((EDITORIAL_SLUGS as readonly string[]).includes(slug)) {
      const cfg =
        row.config && typeof row.config === 'object' && !Array.isArray(row.config)
          ? (row.config as Record<string, unknown>)
          : {}
      ;(editorial as Record<EditorialSlug, unknown>)[slug as EditorialSlug] = cfg
    }
  }

  return { products, categories, brands, editorial }
}

export default async function StorePage() {
  await ensureAppAdminOrRedirect('/store')
  const { products, categories, brands, editorial } = await fetchStoreData()

  return (
    <div className="min-h-screen min-w-[375px] bg-[#F7F7F7] text-[#111111]">
      <StoreExploreClient
        products={products}
        categories={categories}
        brands={brands}
        editorial={editorial}
      />
    </div>
  )
}
