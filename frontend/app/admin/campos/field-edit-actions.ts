'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'

const MAX_GALLERY = 6

export type UpdateFieldAdminPayload = {
  fieldId: string
  nombre: string
  descripcion: string | null
  horarios: string | null
  ubicacion_lat: number | null
  ubicacion_lng: number | null
  telefono: string | null
  instagram: string | null
  foto_portada_url: string | null
  galeria_urls: string[] | null
  team_id: string | null
}

export async function updateFieldAdmin(
  payload: UpdateFieldAdminPayload
): Promise<{ success: true } | { error: string }> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) {
    return { error: 'No autorizado.' }
  }

  const fieldId = payload.fieldId?.trim()
  if (!fieldId) {
    return { error: 'Campo no válido.' }
  }

  const n = payload.nombre.trim()
  if (!n || n.length > 80) {
    return { error: 'El nombre es obligatorio (máx. 80 caracteres).' }
  }

  const descripcion = payload.descripcion?.trim() ?? ''
  const horarios = payload.horarios?.trim() ?? ''
  if (descripcion.length > 500 || horarios.length > 200) {
    return { error: 'Revisa los límites de descripción u horarios.' }
  }

  let galeria = payload.galeria_urls
  if (galeria && galeria.length > MAX_GALLERY) {
    galeria = galeria.slice(0, MAX_GALLERY)
  }

  const team_id = payload.team_id?.trim() || null
  if (team_id) {
    const supabase = createAdminClient()
    const { data: t } = await supabase
      .from('teams')
      .select('id')
      .eq('id', team_id)
      .maybeSingle()
    if (!t) {
      return { error: 'Equipo no válido.' }
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('fields')
    .update({
      nombre: n,
      descripcion: descripcion || null,
      horarios: horarios || null,
      ubicacion_lat: payload.ubicacion_lat,
      ubicacion_lng: payload.ubicacion_lng,
      telefono: payload.telefono?.trim() || null,
      instagram: payload.instagram?.trim() || null,
      foto_portada_url: payload.foto_portada_url?.trim() || null,
      galeria_urls: galeria && galeria.length > 0 ? galeria : null,
      team_id,
    })
    .eq('id', fieldId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/campos')
  return { success: true }
}
