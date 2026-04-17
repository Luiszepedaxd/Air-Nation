import type { Metadata } from 'next'
import { ensureAppAdminOrRedirect } from '@/app/admin/require-app-admin'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { StoreExploreClient } from './StoreExploreClient'
import type {
  HomepageBlock,
  HomepageBlockTipo,
  StoreBrand,
  StoreCategory,
  StoreProduct,
} from './types'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Store — AirNation',
  description: 'Vista previa admin de la tienda oficial AirNation.',
}

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

function mapHomepageBlock(row: Record<string, unknown>): HomepageBlock {
  const tipoRaw = String(row.tipo ?? 'hero')
  const validTipos: HomepageBlockTipo[] = [
    'hero',
    'banner_producto',
    'categorias_grid',
    'carrusel_productos',
    'blog_destacado',
    'texto_libre',
  ]
  const tipo: HomepageBlockTipo = (validTipos as string[]).includes(tipoRaw)
    ? (tipoRaw as HomepageBlockTipo)
    : 'hero'
  const cfgRaw = row.config
  const config: Record<string, unknown> =
    cfgRaw && typeof cfgRaw === 'object' && !Array.isArray(cfgRaw)
      ? (cfgRaw as Record<string, unknown>)
      : {}
  return {
    id: String(row.id ?? ''),
    tipo,
    orden: Number(row.orden ?? 0),
    activo: Boolean(row.activo),
    config,
  }
}

async function fetchStoreData(): Promise<{
  products: StoreProduct[]
  categories: StoreCategory[]
  brands: StoreBrand[]
  blocks: HomepageBlock[]
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
      .select('id, tipo, orden, activo, config')
      .eq('activo', true)
      .order('orden', { ascending: true }),
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
  const blocks = (blocksRes.data ?? []).map((row) =>
    mapHomepageBlock(row as Record<string, unknown>)
  )

  return { products, categories, brands, blocks }
}

export default async function StorePage() {
  await ensureAppAdminOrRedirect('/store')
  const { products, categories, brands, blocks } = await fetchStoreData()

  return (
    <div className="min-h-screen min-w-[375px] bg-[#F7F7F7] text-[#111111]">
      <StoreExploreClient
        products={products}
        categories={categories}
        brands={brands}
        blocks={blocks}
      />
    </div>
  )
}
