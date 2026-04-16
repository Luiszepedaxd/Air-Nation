'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

// ── CATEGORÍAS ────────────────────────────────────────────────

export async function createCategory(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  const parent_id = String(formData.get('parent_id') ?? '').trim() || null

  if (!nombre || !slug) return { error: 'Nombre y slug son requeridos.' }

  const db = createAdminClient()
  const { error } = await db.from('store_categories').insert({ nombre, slug, parent_id })
  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db.from('store_categories').delete().eq('id', id.trim())
  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

// ── MARCAS ────────────────────────────────────────────────────

export async function createBrand(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  const logo_url = String(formData.get('logo_url') ?? '').trim() || null
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null

  if (!nombre || !slug) return { error: 'Nombre y slug son requeridos.' }

  const db = createAdminClient()
  const { error } = await db.from('store_brands').insert({ nombre, slug, logo_url, descripcion })
  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

export async function deleteBrand(id: string): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db.from('store_brands').delete().eq('id', id.trim())
  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

// ── PRODUCTOS ─────────────────────────────────────────────────

export async function createProduct(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  const precio = Number(formData.get('precio'))
  const precio_costo = formData.get('precio_costo') ? Number(formData.get('precio_costo')) : null
  const stock = Number(formData.get('stock') ?? 0)
  const stock_visible = formData.get('stock_visible') === 'true'
  const condicion = String(formData.get('condicion') ?? 'nuevo') as 'nuevo' | 'outlet'
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null
  const que_incluye = String(formData.get('que_incluye') ?? '').trim() || null
  const categoria_id = String(formData.get('categoria_id') ?? '').trim() || null
  const brand_id = String(formData.get('brand_id') ?? '').trim() || null
  const destacado = formData.get('destacado') === 'true'
  const dias_manejo = Number(formData.get('dias_manejo') ?? 3)
  const deporte = String(formData.get('deporte') ?? 'general')

  if (!nombre || !slug || !precio) return { error: 'Nombre, slug y precio son requeridos.' }
  if (isNaN(precio) || precio <= 0) return { error: 'Precio inválido.' }

  const db = createAdminClient()
  const { error } = await db.from('store_products').insert({
    nombre, slug, precio, precio_costo, stock, stock_visible,
    condicion, descripcion, que_incluye, categoria_id, brand_id,
    destacado, dias_manejo, deporte,
    created_by: adminId,
  })
  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

export async function toggleProductActivo(id: string, activo: boolean): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db.from('store_products').update({ activo }).eq('id', id.trim())
  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

export async function toggleProductDestacado(id: string, destacado: boolean): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db.from('store_products').update({ destacado }).eq('id', id.trim())
  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

export async function deleteProduct(id: string): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db.from('store_products').delete().eq('id', id.trim())
  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}
