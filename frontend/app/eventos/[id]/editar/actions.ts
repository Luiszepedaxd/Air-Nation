'use server'

import { revalidatePath } from 'next/cache'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'

export async function updateEventoEdicion(
  eventId: string,
  payload: {
    title: string
    descripcion: string | null
    imagen_url: string | null
    cupo: number
    tipo: 'publico' | 'privado'
    field_id?: string | null
    fecha?: string
    status?: string
  }
): Promise<{ ok: true } | { error: string }> {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Inicia sesión para continuar.' }

  const { data: prof } = await supabase
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = (prof?.app_role as string | undefined) === 'admin'

  const { data: ev, error: evErr } = await supabase
    .from('events')
    .select('id, organizador_id, field_id, fecha')
    .eq('id', eventId)
    .maybeSingle()

  if (evErr || !ev) return { error: 'Evento no encontrado.' }

  const orgId = ev.organizador_id as string | null
  if (orgId !== user.id && !isAdmin) return { error: 'No autorizado.' }

  const t = payload.title.trim()
  if (!t) return { error: 'El título es obligatorio.' }
  if (t.length > 100) return { error: 'El título admite máximo 100 caracteres.' }

  const desc = (payload.descripcion || '').trim()
  if (desc.length > 1000) return { error: 'La descripción admite máximo 1000 caracteres.' }

  const cupo = Math.max(0, Math.min(100000, Math.floor(Number(payload.cupo))))
  if (!Number.isFinite(cupo) || cupo < 0) return { error: 'Cupo inválido.' }

  const tipo = payload.tipo
  if (tipo !== 'publico' && tipo !== 'privado') return { error: 'Tipo inválido.' }

  const fieldIdCurrent = ev.field_id as string | null
  const targetFieldId = isAdmin
    ? (payload.field_id !== undefined ? payload.field_id : fieldIdCurrent)
    : fieldIdCurrent

  if (targetFieldId) {
    const { data: frow } = await supabase
      .from('fields')
      .select('id, tipo, status')
      .eq('id', targetFieldId)
      .maybeSingle()
    if (!frow || frow.status !== 'aprobado') {
      return { error: 'Campo no válido.' }
    }
    const fTipo = (frow.tipo as string | null)?.toLowerCase()
    if (tipo === 'privado' && fTipo !== 'privado') {
      return { error: 'Los eventos privados requieren un campo privado.' }
    }
    if (tipo === 'publico' && fTipo === 'privado') {
      return { error: 'Para un campo privado, el evento debe ser privado.' }
    }
  } else if (tipo === 'privado') {
    return { error: 'El evento privado requiere un campo.' }
  }

  const base = {
    title: t.slice(0, 100),
    descripcion: desc ? desc.slice(0, 1000) : null,
    imagen_url: payload.imagen_url?.trim() || null,
    cupo,
    tipo,
  }

  if (isAdmin) {
    const st = (payload.status || '').toLowerCase()
    if (!['publicado', 'borrador', 'cancelado'].includes(st)) {
      return { error: 'Estado inválido.' }
    }
    const fechaNext =
      payload.fecha !== undefined ? payload.fecha : String(ev.fecha ?? '')
    if (!fechaNext) return { error: 'Indica fecha y hora.' }

    const { error: upErr } = await supabase
      .from('events')
      .update({
        ...base,
        field_id: targetFieldId,
        fecha: fechaNext,
        status: st,
        published: st === 'publicado',
      })
      .eq('id', eventId)

    if (upErr) return { error: upErr.message }
  } else {
    const { error: upErr } = await supabase
      .from('events')
      .update(base)
      .eq('id', eventId)

    if (upErr) return { error: upErr.message }
  }

  revalidatePath('/eventos')
  revalidatePath(`/eventos/${eventId}`)
  revalidatePath('/dashboard/perfil')
  return { ok: true }
}
