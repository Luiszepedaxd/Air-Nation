'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import type { TacticalGamesSlug } from '@/app/tacticalgames/lib/types'
import { TG_SLUGS } from '@/app/tacticalgames/lib/types'

function revalidateAll() {
  revalidatePath('/tacticalgames')
  revalidatePath('/admin/tacticalgames')
}

export async function upsertTacticalGamesBlock(
  slug: TacticalGamesSlug,
  config: Record<string, unknown>
): Promise<{ ok: true; id: string } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  if (!(TG_SLUGS as readonly string[]).includes(slug)) {
    return { error: 'Bloque inválido.' }
  }

  const db = createAdminClient()

  const { data: existing } = await db
    .from('tacticalgames_blocks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await db
      .from('tacticalgames_blocks')
      .update({ config })
      .eq('id', existing.id)

    if (error) return { error: error.message }
    revalidateAll()
    return { ok: true, id: String(existing.id) }
  }

  const { data: maxRow } = await db
    .from('tacticalgames_blocks')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = ((maxRow?.orden as number | undefined) ?? 0) + 1

  const { data, error } = await db
    .from('tacticalgames_blocks')
    .insert({ slug, config, orden, activo: true })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidateAll()
  return { ok: true, id: String(data.id) }
}

/** Alias por consistencia con el patrón OK2 — mismo comportamiento que upsert. */
export async function updateBlockConfig(
  slug: string,
  config: unknown
): Promise<{ ok: true; id: string } | { error: string }> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { error: 'Config inválido.' }
  }
  return upsertTacticalGamesBlock(slug as TacticalGamesSlug, config as Record<string, unknown>)
}

export async function toggleTacticalGamesBlock(
  id: string,
  activo: boolean
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('tacticalgames_blocks')
    .update({ activo })
    .eq('id', id.trim())

  if (error) return { error: error.message }

  revalidateAll()
  return { ok: true }
}

/** Toggle por slug: crea fila vacía si no existe. */
export async function toggleBlockActive(
  slug: string,
  activo: boolean
): Promise<{ ok: true; id: string } | { error: string }> {
  if (!(TG_SLUGS as readonly string[]).includes(slug)) {
    return { error: 'Bloque inválido.' }
  }

  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()

  const { data: existing } = await db
    .from('tacticalgames_blocks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  let rowId: string
  if (!existing?.id) {
    const ins = await upsertTacticalGamesBlock(slug as TacticalGamesSlug, {})
    if ('error' in ins) return ins
    rowId = ins.id
  } else {
    rowId = String(existing.id)
  }

  const toggled = await toggleTacticalGamesBlock(rowId, activo)
  if ('error' in toggled) return toggled
  return { ok: true, id: rowId }
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
    .from('tacticalgames_blocks')
    .select('id')
    .in('id', orderedIds)

  if (fetchErr) return { error: fetchErr.message }
  if (!existing || existing.length !== orderedIds.length) {
    return { error: 'Algún bloque no existe en BD.' }
  }

  const updates = orderedIds.map((id, idx) =>
    db.from('tacticalgames_blocks').update({ orden: idx + 1 }).eq('id', id)
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) return { error: firstError.error.message }

  revalidateAll()
  return { ok: true }
}
