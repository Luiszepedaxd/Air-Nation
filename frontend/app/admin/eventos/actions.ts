'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { getSupabaseForEventosModule } from './eventos-supabase'

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
  published: boolean
  /** Al crear, opcional (por defecto publicado si published). */
  status?: 'publicado' | 'borrador' | 'cancelado'
  /**
   * Solo admin: UUID de organizador. Vacío/null en creación = el usuario actual.
   * En edición, si se envía, actualiza organizador (solo admin).
   */
  organizador_id?: string | null
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

  const base: Record<string, unknown> = {
    title: payload.title.slice(0, 100),
    descripcion: payload.descripcion ? payload.descripcion.slice(0, 1000) : null,
    field_id: payload.field_id || null,
    fecha: payload.fecha,
    cupo: Math.max(0, Math.min(100000, payload.cupo)),
    disciplina: payload.disciplina || 'airsoft',
    tipo: payload.tipo,
    imagen_url: payload.imagen_url?.trim() || null,
    published: payload.published,
    status,
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
