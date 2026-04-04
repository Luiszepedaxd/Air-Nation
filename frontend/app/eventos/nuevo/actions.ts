'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseServerClient } from '@/app/admin/supabase-server'

export type CreateUserEventoPayload = {
  title: string
  descripcion: string
  field_id: string | null
  fecha: string
  cupo: number
  tipo: 'publico' | 'privado'
  imagen_url: string | null
}

export async function createUserEvento(
  payload: CreateUserEventoPayload
): Promise<{ ok: true; id: string } | { error: string }> {
  const supabase = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'no_session' }

  const { data: mods } = await supabase
    .from('team_members')
    .select('team_id, rol_plataforma')
    .eq('user_id', user.id)
    .eq('status', 'activo')

  const modTeamIds = new Set(
    (mods ?? [])
      .filter((m) => {
        const r = (m.rol_plataforma || '').toLowerCase()
        return r === 'founder' || r === 'admin'
      })
      .map((m) => m.team_id as string)
      .filter(Boolean)
  )

  const t = payload.title.trim()
  if (!t) return { error: 'El título es obligatorio.' }
  if (t.length > 100) return { error: 'El título admite máximo 100 caracteres.' }
  const desc = (payload.descripcion || '').trim()
  if (desc.length > 1000) return { error: 'La descripción admite máximo 1000 caracteres.' }

  const cupo = Math.max(0, Math.min(100000, Math.floor(Number(payload.cupo))))
  if (!Number.isFinite(cupo) || cupo < 0) return { error: 'Cupo inválido.' }

  if (!payload.fecha) return { error: 'Indica fecha y hora.' }

  let fieldId: string | null = payload.field_id?.trim() || null

  if (payload.tipo === 'privado') {
    if (!fieldId) return { error: 'Elige el campo privado del equipo.' }
    const { data: frow } = await supabase
      .from('fields')
      .select('id, tipo, team_id, status')
      .eq('id', fieldId)
      .maybeSingle()
    if (!frow || frow.status !== 'aprobado') return { error: 'Campo no válido.' }
    if ((frow.tipo || '').toLowerCase() !== 'privado') {
      return { error: 'Los eventos privados requieren un campo privado.' }
    }
    if (!frow.team_id || !modTeamIds.has(frow.team_id)) {
      return { error: 'No puedes usar ese campo privado.' }
    }
  } else if (fieldId) {
    const { data: frow } = await supabase
      .from('fields')
      .select('id, tipo, status')
      .eq('id', fieldId)
      .maybeSingle()
    if (!frow || frow.status !== 'aprobado') return { error: 'Campo no válido.' }
    if ((frow.tipo || '').toLowerCase() === 'privado') {
      return { error: 'Para un campo privado, el evento debe ser privado.' }
    }
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: t.slice(0, 100),
      descripcion: desc ? desc.slice(0, 1000) : null,
      field_id: fieldId,
      fecha: payload.fecha,
      cupo,
      disciplina: 'airsoft',
      tipo: payload.tipo,
      imagen_url: payload.imagen_url?.trim() || null,
      published: true,
      status: 'publicado',
      organizador_id: user.id,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const id = data?.id as string
  revalidatePath('/eventos')
  revalidatePath(`/eventos/${id}`)
  return { ok: true, id }
}
