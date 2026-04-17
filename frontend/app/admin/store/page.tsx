export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import type { StoreAdminBrandRow, StoreAdminCategoryRow, StoreAdminProductRow } from './data-types'
import { StoreAdminClient } from './StoreAdminClient'
import { HomepageAdminClient } from './HomepageAdminClient'
import type { HomepageBlock, HomepageBlockTipo } from '@/app/store/types'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

type OuterTab = 'productos' | 'categorias' | 'marcas' | 'homepage'

const OUTER_TABS: { id: OuterTab; label: string }[] = [
  { id: 'productos', label: 'Productos' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'marcas', label: 'Marcas' },
  { id: 'homepage', label: 'Homepage' },
]

function normalizeTab(raw: string | undefined): OuterTab {
  if (raw === 'categorias' || raw === 'marcas' || raw === 'homepage') return raw
  return 'productos'
}

function rowStrFromUnknown(row: unknown, key: string): string {
  if (row && typeof row === 'object' && key in (row as Record<string, unknown>)) {
    const v = (row as Record<string, unknown>)[key]
    return v != null ? String(v) : ''
  }
  return ''
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

export default async function AdminStorePage({
  searchParams,
}: {
  searchParams?: { tab?: string }
}) {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const db = createAdminClient()

  const [productsRes, categoriesRes, brandsRes, blocksRes] = await Promise.all([
    db.from('store_products').select('*').order('created_at', { ascending: false }),
    db
      .from('store_categories')
      .select('id, nombre, slug, parent_id, activo')
      .order('nombre', { ascending: true }),
    db
      .from('store_brands')
      .select('id, nombre, slug, activo, logo_url')
      .order('nombre', { ascending: true }),
    db
      .from('store_homepage_blocks')
      .select('id, tipo, orden, activo, config')
      .order('orden', { ascending: true }),
  ])

  if (productsRes.error) console.error('[admin/store] products:', productsRes.error.message)
  if (categoriesRes.error) console.error('[admin/store] categories:', categoriesRes.error.message)
  if (brandsRes.error) console.error('[admin/store] brands:', brandsRes.error.message)
  if (blocksRes.error) console.error('[admin/store] blocks:', blocksRes.error.message)

  const products = (productsRes.data ?? []) as StoreAdminProductRow[]
  const categories = (categoriesRes.data ?? []) as StoreAdminCategoryRow[]
  const brands = (brandsRes.data ?? []) as StoreAdminBrandRow[]
  const blocks = ((blocksRes.data ?? []) as Record<string, unknown>[]).map(mapHomepageBlock)

  const tab = normalizeTab(searchParams?.tab)

  const productsLite = products.map((p) => ({
    id: rowStrFromUnknown(p, 'id'),
    nombre: rowStrFromUnknown(p, 'nombre'),
  }))
  const categoriesLite = categories.map((c) => ({ id: c.id, nombre: c.nombre }))

  return (
    <div className="p-6">
      <h1
        className="mb-6 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        STORE — GESTIÓN
      </h1>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-3">
        {OUTER_TABS.map((t) => {
          const active = t.id === tab
          return (
            <Link
              key={t.id}
              href={`/admin/store?tab=${t.id}`}
              className={`px-3 py-2 text-[11px] tracking-[0.12em] transition-colors ${
                active
                  ? 'bg-[#CC4B37] text-[#FFFFFF]'
                  : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] hover:text-[#111111]'
              }`}
              style={{ ...jostHeading, borderRadius: 2 }}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {tab === 'homepage' ? (
        <HomepageAdminClient
          initialBlocks={blocks}
          products={productsLite}
          categories={categoriesLite}
        />
      ) : (
        <StoreAdminClient
          key={tab}
          products={products}
          categories={categories}
          brands={brands}
          initialTab={tab}
        />
      )}
    </div>
  )
}
