'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

export type SponsorRow = {
  id: string
  nombre: string
  logo_url: string
  link: string
  activo: boolean
  orden: number
  created_at?: string
}

export type UpsertSponsorInput = {
  id?: string
  nombre: string
  logo_url: string
  link: string
  activo: boolean
  orden: number
}

function revalidateSponsors() {
  revalidatePath('/admin/sponsors')
}

export async function getSponsors(): Promise<SponsorRow[]> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return []

  const db = createAdminClient()
  const { data, error } = await db
    .from('sponsors')
    .select('id, nombre, logo_url, link, activo, orden, created_at')
    .order('orden', { ascending: true })

  if (error) {
    console.error('[admin/sponsors] getSponsors:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    nombre: String(row.nombre ?? ''),
    logo_url: String(row.logo_url ?? ''),
    link: String(row.link ?? ''),
    activo: Boolean(row.activo),
    orden: Number(row.orden ?? 0),
    created_at: row.created_at ? String(row.created_at) : undefined,
  }))
}

export async function upsertSponsor(
  data: UpsertSponsorInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const nombre = data.nombre.trim()
  if (!nombre) return { error: 'El nombre es obligatorio.' }

  const link = data.link.trim()
  if (link && !/^https?:\/\//i.test(link)) {
    return { error: 'El link debe ser http(s) o vacío.' }
  }

  const db = createAdminClient()
  const payload = {
    nombre,
    logo_url: data.logo_url.trim(),
    link,
    activo: Boolean(data.activo),
    orden: Number(data.orden) || 1,
  }

  if (data.id?.trim()) {
    const { error } = await db.from('sponsors').update(payload).eq('id', data.id.trim())
    if (error) return { error: error.message }
    revalidateSponsors()
    return { ok: true, id: data.id.trim() }
  }

  let orden = payload.orden
  if (!orden) {
    const { data: maxRow } = await db
      .from('sponsors')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()
    orden = ((maxRow?.orden as number | undefined) ?? 0) + 1
  }

  const { data: inserted, error } = await db
    .from('sponsors')
    .insert({ ...payload, orden })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidateSponsors()
  return { ok: true, id: String(inserted.id) }
}

export async function deleteSponsor(id: string): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }

  const db = createAdminClient()
  const { error } = await db.from('sponsors').delete().eq('id', id.trim())
  if (error) return { error: error.message }

  revalidateSponsors()
  return { ok: true }
}

export async function reorderSponsors(
  ids: string[]
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }
  if (!Array.isArray(ids) || ids.length === 0) return { error: 'Lista vacía.' }

  const db = createAdminClient()
  const updates = ids.map((id, idx) =>
    db.from('sponsors').update({ orden: idx + 1 }).eq('id', id.trim())
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)
  if (firstError?.error) return { error: firstError.error.message }

  revalidateSponsors()
  return { ok: true }
}
