'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { getSupabaseForEventosModule } from './eventos-supabase'

function normalizeUrlExterna(v: string | null | undefined): string | null {
  const raw = (v ?? '').trim()
  if (!raw) return null
  if (!/^https?:\/\//i.test(raw)) return null
  return raw
}

export async function toggleEventPublished(
  id: string,
  published: boolean
): Promise<{ ok: true } | { error: string }> {
  const ctx = await getSupabaseForEventosModule()
  if ('error' in ctx) return { error: ctx.error }

  const { error } = await ctx.supabase
    .from('events')
    .update({ published })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/eventos')
  revalidatePath('/eventos')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function cancelEvent(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const ctx = await getSupabaseForEventosModule()
  if ('error' in ctx) return { error: ctx.error }

  const { error } = await ctx.supabase
    .from('events')
    .update({ status: 'cancelado' })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/eventos')
  revalidatePath('/eventos')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteEvent(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/eventos')
  revalidatePath('/eventos')
  revalidatePath('/dashboard')
  return { ok: true }
}

export type EventoUpsertPayload = {
  id?: string
  title: string
  descripcion: string
  field_id: string | null
  fecha: string
  cupo: number
  disciplina: string
  tipo: 'publico' | 'privado'
  imagen_url: string | null
  url_externa: string | null
  published: boolean
  /** Al crear, opcional (por defecto publicado si published). */
  status?: 'publicado' | 'borrador' | 'cancelado'
  /**
   * Solo admin: UUID de organizador. Vacío/null en creación = el usuario actual.
   * En edición, si se envía, actualiza organizador (solo admin).
   */
  organizador_id?: string | null
  /** Solo admin: sede de texto libre (eventos editoriales sin field AN). */
  sede_nombre?: string | null
  sede_ciudad?: string | null
  cupo_vendido_creador: number | null
}

export async function upsertEvento(
  payload: EventoUpsertPayload
): Promise<{ ok: true; id: string } | { error: string }> {
  const ctx = await getSupabaseForEventosModule()
  if ('error' in ctx) return { error: ctx.error }

  const uid = ctx.userId

  const status: 'publicado' | 'borrador' | 'cancelado' =
    payload.status === 'cancelado'
      ? 'cancelado'
      : payload.published
        ? 'publicado'
        : 'borrador'

  const cupoNorm = Math.max(0, Math.min(100000, payload.cupo))
  let cupoVendido: number | null = payload.cupo_vendido_creador
  if (cupoVendido !== null) {
    if (!Number.isFinite(cupoVendido) || cupoVendido < 0) {
      return { error: 'Lugares vendidos inválido.' }
    }
    cupoVendido = Math.floor(cupoVendido)
    if (cupoNorm > 0 && cupoVendido > cupoNorm) {
      return { error: 'Los lugares vendidos no pueden superar el cupo total.' }
    }
  }

  const base: Record<string, unknown> = {
    title: payload.title.slice(0, 100),
    descripcion: payload.descripcion ? payload.descripcion.slice(0, 1000) : null,
    field_id: payload.field_id || null,
    fecha: payload.fecha,
    cupo: cupoNorm,
    cupo_vendido_creador: cupoVendido,
    disciplina: payload.disciplina || 'airsoft',
    tipo: payload.tipo,
    imagen_url: payload.imagen_url?.trim() || null,
    url_externa: normalizeUrlExterna(payload.url_externa),
    published: payload.published,
    status,
  }

  if (ctx.role === 'admin') {
    base.sede_nombre = payload.sede_nombre ?? null
    base.sede_ciudad = payload.sede_ciudad ?? null
  }

  if (payload.id) {
    if (ctx.role === 'admin' && payload.organizador_id !== undefined) {
      const raw = payload.organizador_id?.trim()
      base.organizador_id = raw && raw.length ? raw : uid
    }
    const { error } = await ctx.supabase
      .from('events')
      .update(base)
      .eq('id', payload.id)
    if (error) return { error: error.message }
    revalidatePath('/admin/eventos')
    revalidatePath(`/admin/eventos/${payload.id}/editar`)
    revalidatePath('/eventos')
    revalidatePath(`/eventos/${payload.id}`)
    revalidatePath('/dashboard')
    return { ok: true, id: payload.id }
  }

  let organizerForInsert = uid
  if (ctx.role === 'admin' && payload.organizador_id?.trim()) {
    organizerForInsert = payload.organizador_id.trim()
  }

  const insertRow = {
    ...base,
    organizador_id: organizerForInsert,
    created_by: uid,
  }

  const { data, error } = await ctx.supabase
    .from('events')
    .insert(insertRow)
    .select('id')
    .single()

  if (error) return { error: error.message }
  const newId = data?.id as string
  revalidatePath('/admin/eventos')
  revalidatePath('/eventos')
  revalidatePath('/dashboard')
  return { ok: true, id: newId }
}
