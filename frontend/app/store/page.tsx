import type { Metadata } from 'next'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { StoreExploreClient } from './StoreExploreClient'
import type { EditorialData } from './StoreExploreClient'
import type { StoreBrand, StoreCategory, StoreProduct } from './types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Store — AirNation',
  description: 'Réplicas, accesorios y equipo de protección para airsoft, gotcha y gelsoft. Envío gratis a todo México.',
}

const EDITORIAL_SLUGS = [
  'hero',
  'banner1',
  'banner2',
  'promoBanner',
  'ticker',
  'header',
  'footer',
  'categorias_carousel',
] as const
type EditorialSlug = (typeof EDITORIAL_SLUGS)[number]

function mapProduct(row: Record<string, unknown>): StoreProduct {
  const condRaw = String(row.condicion ?? 'nuevo').toLowerCase()
  const condicion: 'nuevo' | 'outlet' = condRaw === 'outlet' ? 'outlet' : 'nuevo'
  const optNum = (v: unknown): number | null => {
    if (v == null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
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
    peso_kg: optNum(row.peso_kg),
    largo_cm: optNum(row.largo_cm),
    ancho_cm: optNum(row.ancho_cm),
    alto_cm: optNum(row.alto_cm),
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
      .order('created_at', { ascending: true }),
    supabase
      .from('store_categories')
      .select('id, nombre, slug, parent_id')
      .eq('activo', true),
    supabase.from('store_brands').select('id, nombre, slug, logo_url').eq('activo', true),
    supabase
      .from('store_homepage_blocks')
      .select('tipo, config, activo')
      .in('tipo', EDITORIAL_SLUGS as unknown as string[])
      .order('tipo'),
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

  const bloques_activos = {
    header: false,
    hero: false,
    ticker: false,
    banner1: false,
    banner2: false,
    categorias_carousel: false,
    promoBanner: false,
    footer: false,
  } as Record<string, boolean>

  const rows = (blocksRes.data ?? []) as Array<{
    tipo: string
    config: unknown
    activo: boolean | null
  }>
  for (const row of rows) {
    const slug = row.tipo
    if (!(EDITORIAL_SLUGS as readonly string[]).includes(slug)) continue

    const cfg =
      row.config && typeof row.config === 'object' && !Array.isArray(row.config)
        ? (row.config as Record<string, unknown>)
        : {}
    ;(editorial as Record<EditorialSlug, unknown>)[slug as EditorialSlug] = cfg

    bloques_activos[slug] = row.activo === null ? true : row.activo === true
  }

  editorial.bloques_activos = bloques_activos as EditorialData['bloques_activos']

  console.log('[STORE BLOCKS RAW]', JSON.stringify(blocksRes.data))
  console.log('[STORE BLOQUES_ACTIVOS]', JSON.stringify(bloques_activos))

  return { products, categories, brands, editorial }
}

export default async function StorePage() {
  const { products, categories, brands, editorial } = await fetchStoreData()
  const shuffled = [...(products ?? [])].sort(() => Math.random() - 0.5)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#F7F7F7] text-[#111111]">
      <StoreExploreClient
        products={shuffled}
        categories={categories}
        brands={brands}
        editorial={editorial}
      />
    </div>
  )
}
