'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import type { OperacionKursk2Slug } from '@/app/operacionkursk2/lib/types'
import { OK2_SLUGS } from '@/app/operacionkursk2/lib/types'

function revalidateAll() {
  revalidatePath('/operacionkursk2')
  revalidatePath('/admin/operacionkursk2')
}

export async function upsertOperacionKursk2Block(
  slug: OperacionKursk2Slug,
  config: Record<string, unknown>
): Promise<{ ok: true; id: string } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  if (!(OK2_SLUGS as readonly string[]).includes(slug)) {
    return { error: 'Bloque inválido.' }
  }

  const db = createAdminClient()

  const { data: existing } = await db
    .from('operacionkursk2_blocks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await db
      .from('operacionkursk2_blocks')
      .update({ config })
      .eq('id', existing.id)

    if (error) return { error: error.message }
    revalidateAll()
    return { ok: true, id: String(existing.id) }
  }

  const { data: maxRow } = await db
    .from('operacionkursk2_blocks')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = ((maxRow?.orden as number | undefined) ?? 0) + 1

  const { data, error } = await db
    .from('operacionkursk2_blocks')
    .insert({ slug, config, orden, activo: true })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidateAll()
  return { ok: true, id: String(data.id) }
}

/** Alias pedido por spec — mismo comportamiento que upsert. */
export async function updateBlockConfig(
  slug: string,
  config: unknown
): Promise<{ ok: true; id: string } | { error: string }> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { error: 'Config inválido.' }
  }
  return upsertOperacionKursk2Block(slug as OperacionKursk2Slug, config as Record<string, unknown>)
}

export async function toggleOperacionKursk2Block(
  id: string,
  activo: boolean
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('operacionkursk2_blocks')
    .update({ activo })
    .eq('id', id.trim())

  if (error) return { error: error.message }

  revalidateAll()
  return { ok: true }
}

/** Toggle por slug: crea fila vacía si no existe (mismo patrón que el cliente BM2). */
export async function toggleBlockActive(
  slug: string,
  activo: boolean
): Promise<{ ok: true; id: string } | { error: string }> {
  if (!(OK2_SLUGS as readonly string[]).includes(slug)) {
    return { error: 'Bloque inválido.' }
  }

  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()

  const { data: existing } = await db
    .from('operacionkursk2_blocks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  let rowId: string
  if (!existing?.id) {
    const ins = await upsertOperacionKursk2Block(slug as OperacionKursk2Slug, {})
    if ('error' in ins) return ins
    rowId = ins.id
  } else {
    rowId = String(existing.id)
  }

  const toggled = await toggleOperacionKursk2Block(rowId, activo)
  if ('error' in toggled) return toggled
  return { ok: true, id: rowId }
}

export async function reorderOperacionKursk2Block(
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

  const r1 = await db.from('operacionkursk2_blocks').update({ orden: b.orden }).eq('id', a.id)
  const r2 = await db.from('operacionkursk2_blocks').update({ orden: a.orden }).eq('id', b.id)
  if (r1.error) return { error: r1.error.message }
  if (r2.error) return { error: r2.error.message }

  revalidateAll()
  return { ok: true }
}

/*
 * NOTA (fundador): tras deploy, limpiar fila legacy en Supabase SQL Editor si aplica:
 *
 * DELETE FROM operacionkursk2_blocks WHERE slug = 'cta_final';
 */
