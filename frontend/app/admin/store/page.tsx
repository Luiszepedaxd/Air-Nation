export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import type { StoreAdminBrandRow, StoreAdminCategoryRow, StoreAdminProductRow } from './data-types'
import { StoreAdminClient } from './StoreAdminClient'
import { HomepageAdminClient } from './HomepageAdminClient'
import type { BloqueRecord } from './HomepageAdminClient'
import type { BloqueSlug } from './homepage-actions'
import { DatosBancariosAdmin } from './DatosBancariosAdmin'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

type OuterTab = 'productos' | 'categorias' | 'marcas' | 'homepage' | 'banco'

const OUTER_TABS: { id: OuterTab; label: string }[] = [
  { id: 'productos', label: 'Productos' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'marcas', label: 'Marcas' },
  { id: 'homepage', label: 'Homepage' },
  { id: 'banco', label: 'Datos Bancarios' },
]

const BLOQUES_SLUGS: readonly BloqueSlug[] = [
  'header',
  'hero',
  'ticker',
  'banner1',
  'banner2',
  'categorias_carousel',
  'promoBanner',
  'footer',
] as const

function normalizeTab(raw: string | undefined): OuterTab {
  if (
    raw === 'categorias' ||
    raw === 'marcas' ||
    raw === 'homepage' ||
    raw === 'banco'
  )
    return raw
  return 'productos'
}

export default async function AdminStorePage({
  searchParams,
}: {
  searchParams?: { tab?: string }
}) {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const db = createAdminClient()

  const [productsRes, categoriesRes, brandsRes, blocksRes, bancoRes] = await Promise.all([
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
      .select('id, tipo, config, activo')
      .in('tipo', BLOQUES_SLUGS as unknown as string[]),
    db
      .from('store_config')
      .select('value')
      .eq('key', 'datos_bancarios')
      .maybeSingle(),
  ])

  if (productsRes.error) console.error('[admin/store] products:', productsRes.error.message)
  if (categoriesRes.error) console.error('[admin/store] categories:', categoriesRes.error.message)
  if (brandsRes.error) console.error('[admin/store] brands:', brandsRes.error.message)
  if (blocksRes.error) console.error('[admin/store] blocks:', blocksRes.error.message)
  if (bancoRes.error) console.error('[admin/store] banco:', bancoRes.error.message)

  const bancoRow = bancoRes.data as { value?: Record<string, string> } | null
  const datosBancarios = (bancoRow?.value ?? {}) as Record<string, string>

  const products = (productsRes.data ?? []) as StoreAdminProductRow[]
  const categories = (categoriesRes.data ?? []) as StoreAdminCategoryRow[]
  const brands = (brandsRes.data ?? []) as StoreAdminBrandRow[]

  const blockRows = (blocksRes.data ?? []) as {
    id: string
    tipo: string
    config: unknown
    activo: unknown
  }[]
  const bloqueRecords: BloqueRecord[] = BLOQUES_SLUGS.map((slug) => {
    const found = blockRows.find((b) => b.tipo === slug)
    const cfg =
      found?.config && typeof found.config === 'object' && !Array.isArray(found.config)
        ? (found.config as Record<string, unknown>)
        : {}
    return {
      id: found?.id ? String(found.id) : null,
      slug: slug as BloqueSlug,
      config: cfg,
      activo: found ? Boolean(found.activo) : true,
    }
  })

  const tab = normalizeTab(searchParams?.tab)

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

      {tab === 'banco' ? (
        <DatosBancariosAdmin
          initialDatos={{
            banco: datosBancarios.banco ?? '',
            clabe: datosBancarios.clabe ?? '',
            titular: datosBancarios.titular ?? '',
            concepto: datosBancarios.concepto ?? 'Pedido AirNation #[ORDER_NUMBER]',
          }}
        />
      ) : tab === 'homepage' ? (
        <HomepageAdminClient initialBlocks={bloqueRecords} />
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
