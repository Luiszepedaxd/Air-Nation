export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import type { StoreAdminBrandRow, StoreAdminCategoryRow, StoreAdminProductRow } from './data-types'
import { StoreAdminClient } from './StoreAdminClient'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminStorePage() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const db = createAdminClient()

  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    db.from('store_products').select('*').order('created_at', { ascending: false }),
    db
      .from('store_categories')
      .select('id, nombre, slug, parent_id, activo')
      .order('nombre', { ascending: true }),
    db
      .from('store_brands')
      .select('id, nombre, slug, activo, logo_url')
      .order('nombre', { ascending: true }),
  ])

  if (productsRes.error) console.error('[admin/store] products:', productsRes.error.message)
  if (categoriesRes.error) console.error('[admin/store] categories:', categoriesRes.error.message)
  if (brandsRes.error) console.error('[admin/store] brands:', brandsRes.error.message)

  const products = (productsRes.data ?? []) as StoreAdminProductRow[]
  const categories = (categoriesRes.data ?? []) as StoreAdminCategoryRow[]
  const brands = (brandsRes.data ?? []) as StoreAdminBrandRow[]

  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        STORE — GESTIÓN
      </h1>
      <StoreAdminClient products={products} categories={categories} brands={brands} />
    </div>
  )
}
