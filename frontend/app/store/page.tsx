import type { Metadata } from 'next'
import { ensureAppAdminOrRedirect } from '@/app/admin/require-app-admin'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { StoreExploreClient } from './StoreExploreClient'
import type { StoreBrand, StoreCategory, StoreProduct } from './types'

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

async function fetchStoreData(): Promise<{
  products: StoreProduct[]
  categories: StoreCategory[]
  brands: StoreBrand[]
}> {
  const supabase = createDashboardSupabaseServerClient()

  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
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

  const products = (productsRes.data ?? []).map((row) =>
    mapProduct(row as Record<string, unknown>)
  )
  const categories = (categoriesRes.data ?? []).map((row) =>
    mapCategory(row as Record<string, unknown>)
  )
  const brands = (brandsRes.data ?? []).map((row) => mapBrand(row as Record<string, unknown>))

  return { products, categories, brands }
}

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

export default async function StorePage() {
  await ensureAppAdminOrRedirect('/store')
  const { products, categories, brands } = await fetchStoreData()

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className="text-2xl font-extrabold uppercase leading-tight text-white"
              style={jost}
            >
              Store
            </h1>
            <span
              style={jost}
              className="bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-extrabold uppercase leading-none text-white"
            >
              Admin preview
            </span>
          </div>
          <p className="mt-2 text-sm text-[#999999]" style={lato}>
            La tienda oficial de AirNation
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <StoreExploreClient products={products} categories={categories} brands={brands} />
      </div>
    </div>
  )
}
