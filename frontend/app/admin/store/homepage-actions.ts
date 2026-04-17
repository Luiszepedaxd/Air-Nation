'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import type { HomepageBlockTipo } from '@/app/store/types'

export async function createHomepageBlock(
  tipo: HomepageBlockTipo,
  config: Record<string, unknown>
): Promise<{ ok: true; id: string } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()

  const { data: maxRow } = await db
    .from('store_homepage_blocks')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = ((maxRow?.orden as number | undefined) ?? 0) + 1

  const { data, error } = await db
    .from('store_homepage_blocks')
    .insert({ tipo, config, orden })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true, id: String(data.id) }
}

export async function updateHomepageBlock(
  id: string,
  config: Record<string, unknown>
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('store_homepage_blocks')
    .update({ config })
    .eq('id', id.trim())

  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

export async function toggleHomepageBlock(
  id: string,
  activo: boolean
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('store_homepage_blocks')
    .update({ activo })
    .eq('id', id.trim())

  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

export async function reorderHomepageBlock(
  id: string,
  direction: 'up' | 'down',
  blocks: { id: string; orden: number }[]
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const sorted = [...blocks].sort((a, b) => a.orden - b.orden)
  const idx = sorted.findIndex((b) => b.id === id)
  if (idx === -1) return { error: 'Bloque no encontrado.' }

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= sorted.length) return { ok: true }

  const db = createAdminClient()
  const a = sorted[idx]
  const b = sorted[swapIdx]

  const { error } = await db.rpc('swap_homepage_block_orders', {
    id_a: a.id,
    orden_a: b.orden,
    id_b: b.id,
    orden_b: a.orden,
  })

  if (error) {
    const r1 = await db
      .from('store_homepage_blocks')
      .update({ orden: b.orden })
      .eq('id', a.id)
    const r2 = await db
      .from('store_homepage_blocks')
      .update({ orden: a.orden })
      .eq('id', b.id)
    if (r1.error) return { error: r1.error.message }
    if (r2.error) return { error: r2.error.message }
  }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}

export async function deleteHomepageBlock(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db.from('store_homepage_blocks').delete().eq('id', id.trim())

  if (error) return { error: error.message }

  revalidatePath('/admin/store')
  revalidatePath('/store')
  return { ok: true }
}
