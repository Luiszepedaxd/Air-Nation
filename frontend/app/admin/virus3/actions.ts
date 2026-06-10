'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import type { Virus3Slug } from '@/app/virus3/lib/types'
import { VIRUS3_SLUGS } from '@/app/virus3/lib/types'

function revalidateAll() {
  revalidatePath('/virus3')
  revalidatePath('/admin/virus3')
}

export async function upsertVirus3Block(
  slug: Virus3Slug,
  config: Record<string, unknown>
): Promise<{ ok: true; id: string } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  if (!(VIRUS3_SLUGS as readonly string[]).includes(slug)) {
    return { error: 'Bloque inválido.' }
  }

  const db = createAdminClient()

  const { data: existing } = await db
    .from('virus3_blocks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await db
      .from('virus3_blocks')
      .update({ config })
      .eq('id', existing.id)

    if (error) return { error: error.message }
    revalidateAll()
    return { ok: true, id: String(existing.id) }
  }

  const { data: maxRow } = await db
    .from('virus3_blocks')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = ((maxRow?.orden as number | undefined) ?? 0) + 1

  const { data, error } = await db
    .from('virus3_blocks')
    .insert({ slug, config, orden, activo: true })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidateAll()
  return { ok: true, id: String(data.id) }
}

export async function updateBlockConfig(
  slug: string,
  config: unknown
): Promise<{ ok: true; id: string } | { error: string }> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { error: 'Config inválido.' }
  }
  return upsertVirus3Block(slug as Virus3Slug, config as Record<string, unknown>)
}

export async function toggleVirus3Block(
  id: string,
  activo: boolean
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('virus3_blocks')
    .update({ activo })
    .eq('id', id.trim())

  if (error) return { error: error.message }

  revalidateAll()
  return { ok: true }
}

export async function toggleBlockActive(
  slug: string,
  activo: boolean
): Promise<{ ok: true; id: string } | { error: string }> {
  if (!(VIRUS3_SLUGS as readonly string[]).includes(slug)) {
    return { error: 'Bloque inválido.' }
  }

  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()

  const { data: existing } = await db
    .from('virus3_blocks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  let rowId: string
  if (!existing?.id) {
    const ins = await upsertVirus3Block(slug as Virus3Slug, {})
    if ('error' in ins) return ins
    rowId = ins.id
  } else {
    rowId = String(existing.id)
  }

  const toggled = await toggleVirus3Block(rowId, activo)
  if ('error' in toggled) return toggled
  return { ok: true, id: rowId }
}

export async function reorderVirus3Block(
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

  const r1 = await db.from('virus3_blocks').update({ orden: b.orden }).eq('id', a.id)
  const r2 = await db.from('virus3_blocks').update({ orden: a.orden }).eq('id', b.id)
  if (r1.error) return { error: r1.error.message }
  if (r2.error) return { error: r2.error.message }

  revalidateAll()
  return { ok: true }
}

export async function reorderAllBlocks(
  orderedIds: string[]
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: 'Lista de ids vacía.' }
  }

  const db = createAdminClient()

  const { data: existing, error: fetchErr } = await db
    .from('virus3_blocks')
    .select('id')
    .in('id', orderedIds)

  if (fetchErr) return { error: fetchErr.message }
  if (!existing || existing.length !== orderedIds.length) {
    return { error: 'Algún bloque no existe en BD.' }
  }

  const updates = orderedIds.map((id, idx) =>
    db.from('virus3_blocks').update({ orden: idx + 1 }).eq('id', id)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) return { error: firstError.error.message }

  revalidateAll()
  return { ok: true }
}
