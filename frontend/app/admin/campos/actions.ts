'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

type FieldStatus = 'aprobado' | 'rechazado' | 'pendiente'

function isFieldStatus(v: unknown): v is FieldStatus {
  return v === 'aprobado' || v === 'rechazado' || v === 'pendiente'
}

export async function updateFieldStatus(
  id: string,
  status: FieldStatus
): Promise<{ success: true } | { error: string }> {
  if (!isFieldStatus(status)) {
    return { error: 'Estado no válido' }
  }

  const trimmedId = id?.trim() ?? ''
  if (!trimmedId) {
    return { error: 'ID no válido' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('fields')
    .update({ status })
    .eq('id', trimmedId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/campos')
  revalidatePath(`/admin/campos/${trimmedId}`)
  return { success: true as const }
}

export async function deleteField(
  id: string
): Promise<{ success: true } | { error: string }> {
  const trimmedId = id?.trim() ?? ''
  if (!trimmedId) {
    return { error: 'ID no válido' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('fields').delete().eq('id', trimmedId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/campos')
  revalidatePath(`/admin/campos/${trimmedId}`)
  return { success: true as const }
}

export async function toggleDestacado(
  id: string,
  destacado: boolean
): Promise<{ success: true } | { error: string }> {
  const trimmedId = id?.trim() ?? ''
  if (!trimmedId) {
    return { error: 'ID no válido' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('fields')
    .update({ destacado })
    .eq('id', trimmedId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/campos')
  return { success: true as const }
}

export async function updateOrdenDestacado(
  id: string,
  orden: number
): Promise<{ success: true } | { error: string }> {
  const trimmedId = id?.trim() ?? ''
  if (!trimmedId) {
    return { error: 'ID no válido' }
  }

  if (!Number.isFinite(orden) || !Number.isInteger(orden)) {
    return { error: 'Orden debe ser un número entero' }
  }
  if (orden < 1) {
    return { error: 'Orden debe ser al menos 1' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('fields')
    .update({ orden_destacado: orden })
    .eq('id', trimmedId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/campos')
  return { success: true as const }
}

export async function approveFieldForm(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  const result = await updateFieldStatus(id, 'aprobado')
  if ('error' in result && result.error) {
    redirect(
      `/admin/campos/${encodeURIComponent(id)}?err=${encodeURIComponent(result.error)}`
    )
  }
  redirect(`/admin/campos/${id}`)
}

export async function rejectFieldForm(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  const result = await updateFieldStatus(id, 'rechazado')
  if ('error' in result && result.error) {
    redirect(
      `/admin/campos/${encodeURIComponent(id)}?err=${encodeURIComponent(result.error)}`
    )
  }
  redirect(`/admin/campos/${id}`)
}

export async function toggleDestacadoForm(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  const raw = formData.get('destacado')
  const destacado = raw === 'true'
  const result = await toggleDestacado(id, destacado)
  if ('error' in result && result.error) {
    redirect(
      `/admin/campos/${encodeURIComponent(id)}?err=${encodeURIComponent(result.error)}`
    )
  }
  redirect(`/admin/campos/${id}`)
}

/** Form: campos ocultos `id`, `orden_destacado` (entero). Redirige al detalle. */
export async function saveOrdenDestacadoForm(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '').trim()
  const raw = formData.get('orden_destacado')
  const orden =
    typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN
  const result = await updateOrdenDestacado(id, orden)
  if ('error' in result && result.error) {
    redirect(
      `/admin/campos/${encodeURIComponent(id)}?err=${encodeURIComponent(result.error)}`
    )
  }
  redirect(`/admin/campos/${id}`)
}

export async function adminCreateFieldPost(
  fieldId: string,
  content: string,
  fotos_urls: string[]
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }
  const fid = fieldId?.trim()
  const text = content?.trim() ?? ''
  if (!fid || !text) return { error: 'Datos incompletos.' }
  const urls = fotos_urls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 4)
  const db = createAdminClient()
  const { error } = await db.from('field_posts').insert({
    field_id: fid,
    content: text,
    fotos_urls: urls,
    created_by: adminId,
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/campos/${fid}`)
  return { ok: true }
}

export async function adminDeleteFieldPost(
  postId: string,
  fieldId: string
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }
  const pid = postId?.trim()
  const fid = fieldId?.trim()
  if (!pid || !fid) return { error: 'ID no válido.' }
  const db = createAdminClient()
  const { error } = await db.from('field_posts').delete().eq('id', pid).eq('field_id', fid)
  if (error) return { error: error.message }
  revalidatePath(`/admin/campos/${fid}`)
  return { ok: true }
}

export async function adminCreateFieldAlbum(
  fieldId: string,
  nombre: string,
  fotos_urls: string[]
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }
  const fid = fieldId?.trim()
  const name = nombre?.trim() ?? ''
  if (!fid || !name) return { error: 'Indica un nombre.' }
  const urls = fotos_urls.filter((u) => typeof u === 'string' && u.trim())
  const db = createAdminClient()
  const { error } = await db.from('field_albums').insert({
    field_id: fid,
    nombre: name,
    fotos_urls: urls,
    created_by: adminId,
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/campos/${fid}`)
  return { ok: true }
}

export async function adminDeleteFieldAlbum(
  albumId: string,
  fieldId: string
): Promise<{ ok: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) return { error: 'No autorizado.' }
  const aid = albumId?.trim()
  const fid = fieldId?.trim()
  if (!aid || !fid) return { error: 'ID no válido.' }
  const db = createAdminClient()
  const { error } = await db.from('field_albums').delete().eq('id', aid).eq('field_id', fid)
  if (error) return { error: error.message }
  revalidatePath(`/admin/campos/${fid}`)
  return { ok: true }
}
