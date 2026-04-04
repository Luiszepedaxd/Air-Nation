'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'

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
