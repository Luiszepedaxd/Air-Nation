import { notFound } from 'next/navigation'
import { ensureAppAdminOrRedirect } from '@/app/admin/require-app-admin'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import type { StoreBrand, StoreCategory, StoreProduct } from '@/app/store/types'
import { ProductDetailClient } from './ProductDetailClient'

export const revalidate = 0

async function fetchProduct(id: string): Promise<{
  product: StoreProduct & {
    descripcion: string | null
    specs: Record<string, unknown>
    que_incluye: string | null
    dias_manejo: number
    deporte: string
  }
  brand: StoreBrand | null
  category: StoreCategory | null
  related: StoreProduct[]
} | null> {
  const supabase = createDashboardSupabaseServerClient()

  const { data: row, error } = await supabase
    .from('store_products')
    .select('id, nombre, slug, fotos_urls, precio, condicion, stock, stock_visible, destacado, activo, brand_id, categoria_id, descripcion, specs, que_incluye, dias_manejo, deporte')
    .eq('id', id)
    .eq('activo', true)
    .maybeSingle()

  if (error || !row) return null

  const r = row as Record<string, unknown>

  const product = {
    id: String(r.id ?? ''),
    nombre: String(r.nombre ?? ''),
    slug: String(r.slug ?? ''),
    fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : [],
    precio: r.precio != null ? Number(r.precio) : 0,
    condicion: (String(r.condicion ?? 'nuevo').toLowerCase() === 'outlet' ? 'outlet' : 'nuevo') as 'nuevo' | 'outlet',
    stock: r.stock != null ? Number(r.stock) : 0,
    stock_visible: Boolean(r.stock_visible),
    destacado: Boolean(r.destacado),
    activo: Boolean(r.activo),
    brand_id: r.brand_id != null ? String(r.brand_id) : null,
    categoria_id: r.categoria_id != null ? String(r.categoria_id) : null,
    descripcion: r.descripcion != null ? String(r.descripcion) : null,
    specs: (r.specs && typeof r.specs === 'object' && !Array.isArray(r.specs)) ? r.specs as Record<string, unknown> : {},
    que_incluye: r.que_incluye != null ? String(r.que_incluye) : null,
    dias_manejo: r.dias_manejo != null ? Number(r.dias_manejo) : 3,
    deporte: String(r.deporte ?? 'general'),
  }

  let brand: StoreBrand | null = null
  if (product.brand_id) {
    const { data: brandRow } = await supabase
      .from('store_brands')
      .select('id, nombre, slug, logo_url')
      .eq('id', product.brand_id)
      .maybeSingle()
    if (brandRow) {
      const b = brandRow as Record<string, unknown>
      brand = {
        id: String(b.id ?? ''),
        nombre: String(b.nombre ?? ''),
        slug: String(b.slug ?? ''),
        logo_url: b.logo_url != null ? String(b.logo_url) : null,
      }
    }
  }

  let category: StoreCategory | null = null
  if (product.categoria_id) {
    const { data: catRow } = await supabase
      .from('store_categories')
      .select('id, nombre, slug, parent_id')
      .eq('id', product.categoria_id)
      .maybeSingle()
    if (catRow) {
      const c = catRow as Record<string, unknown>
      category = {
        id: String(c.id ?? ''),
        nombre: String(c.nombre ?? ''),
        slug: String(c.slug ?? ''),
        parent_id: c.parent_id != null ? String(c.parent_id) : null,
      }
    }
  }

  let related: StoreProduct[] = []
  if (product.categoria_id) {
    const { data: relRows } = await supabase
      .from('store_products')
      .select('id, nombre, slug, fotos_urls, precio, condicion, stock, stock_visible, destacado, activo, brand_id, categoria_id')
      .eq('activo', true)
      .eq('categoria_id', product.categoria_id)
      .neq('id', product.id)
      .limit(6)
    related = (relRows ?? []).map(rel => {
      const rr = rel as Record<string, unknown>
      return {
        id: String(rr.id ?? ''),
        nombre: String(rr.nombre ?? ''),
        slug: String(rr.slug ?? ''),
        fotos_urls: Array.isArray(rr.fotos_urls) ? rr.fotos_urls as string[] : [],
        precio: rr.precio != null ? Number(rr.precio) : 0,
        condicion: (String(rr.condicion ?? 'nuevo').toLowerCase() === 'outlet' ? 'outlet' : 'nuevo') as 'nuevo' | 'outlet',
        stock: rr.stock != null ? Number(rr.stock) : 0,
        stock_visible: Boolean(rr.stock_visible),
        destacado: Boolean(rr.destacado),
        activo: Boolean(rr.activo),
        brand_id: rr.brand_id != null ? String(rr.brand_id) : null,
        categoria_id: rr.categoria_id != null ? String(rr.categoria_id) : null,
      }
    })
  }

  return { product, brand, category, related }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await ensureAppAdminOrRedirect(`/store/${params.id}`)
  const data = await fetchProduct(params.id)
  if (!data) notFound()
  return <ProductDetailClient {...data} />
}
