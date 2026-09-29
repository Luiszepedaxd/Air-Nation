'use server'

import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'

const DESCRIPCION_MAX = 1000

export type UpdateCampoOwnerInput = {
  fieldId: string
  nombre: string
  ciudad: string | null
  estado: string | null
  descripcion: string | null
  horarios_json: Record<string, unknown> | null
  direccion: string | null
  maps_url: string | null
  logo_url: string | null
  telefono: string | null
  instagram: string | null
  foto_portada_url: string | null
  galeria_urls: string[] | null
  team_id: string | null
}

export async function updateCampoOwner(
  input: UpdateCampoOwnerInput
): Promise<{ success: true } | { error: string }> {
  const fieldId = input.fieldId?.trim()
  if (!fieldId) {
    return { error: 'Campo no válido.' }
  }

  const descripcion = input.descripcion?.trim() ?? ''
  if (descripcion.length > DESCRIPCION_MAX) {
    return { error: 'La descripción puede tener hasta 1000 caracteres.' }
  }

  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado.' }
  }

  const { error } = await supabase
    .from('fields')
    .update({
      nombre: input.nombre,
      ciudad: input.ciudad,
      estado: input.estado,
      descripcion: descripcion || null,
      horarios_json: input.horarios_json,
      direccion: input.direccion,
      maps_url: input.maps_url,
      logo_url: input.logo_url,
      telefono: input.telefono,
      instagram: input.instagram,
      foto_portada_url: input.foto_portada_url,
      galeria_urls: input.galeria_urls,
      team_id: input.team_id,
    })
    .eq('id', fieldId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
