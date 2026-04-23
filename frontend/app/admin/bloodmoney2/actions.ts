'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import type { BloodMoney2Slug } from '@/app/bloodmoney2/types'
import { BM2_SLUGS } from '@/app/bloodmoney2/types'

function revalidateAll() {
  revalidatePath('/bloodmoney2')
  revalidatePath('/admin/bloodmoney2')
}

export async function upsertBloodMoney2Block(
  slug: BloodMoney2Slug,
  config: Record<string, unknown>
): Promise<{ ok: true; id: string } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  if (!(BM2_SLUGS as readonly string[]).includes(slug)) {
    return { error: 'Bloque inválido.' }
  }

  const db = createAdminClient()

  const { data: existing } = await db
    .from('bloodmoney2_blocks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await db
      .from('bloodmoney2_blocks')
      .update({ config })
      .eq('id', existing.id)

    if (error) return { error: error.message }
    revalidateAll()
    return { ok: true, id: String(existing.id) }
  }

  const { data: maxRow } = await db
    .from('bloodmoney2_blocks')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const orden = ((maxRow?.orden as number | undefined) ?? 0) + 1

  const { data, error } = await db
    .from('bloodmoney2_blocks')
    .insert({ slug, config, orden, activo: true })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidateAll()
  return { ok: true, id: String(data.id) }
}

export async function toggleBloodMoney2Block(
  id: string,
  activo: boolean
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db
    .from('bloodmoney2_blocks')
    .update({ activo })
    .eq('id', id.trim())

  if (error) return { error: error.message }

  revalidateAll()
  return { ok: true }
}

export async function reorderBloodMoney2Block(
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

  const r1 = await db.from('bloodmoney2_blocks').update({ orden: b.orden }).eq('id', a.id)
  const r2 = await db.from('bloodmoney2_blocks').update({ orden: a.orden }).eq('id', b.id)
  if (r1.error) return { error: r1.error.message }
  if (r2.error) return { error: r2.error.message }

  revalidateAll()
  return { ok: true }
}
