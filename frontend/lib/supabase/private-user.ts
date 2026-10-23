import type { SupabaseClient } from '@supabase/supabase-js'

/** Fila propia con columnas sensibles (RPC mi_usuario_privado). */
export type MiUsuarioPrivadoRow = {
  id: string
  nombre: string | null
  alias: string | null
  email: string | null
  ciudad: string | null
  estado: string | null
  rol: string | null
  avatar_url: string | null
  foto_credencial_url: string | null
  credencial_nombre_completo: string | null
  credencial_fecha_nacimiento: string | null
  member_number: string | number | null
  created_at: string
  app_role: string | null
  team_id: string | null
  bio: string | null
  perfil_publico: boolean | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
  facebook: string | null
  foto_portada_url: string | null
  como_se_entero: string | null
  registered_at_event: string | null
}

export type VerificarCredencialRow = {
  id: string
  nombre: string | null
  alias: string | null
  avatar_url: string | null
  foto_credencial_url: string | null
  credencial_nombre_completo: string | null
  mayor_de_edad: boolean | null
  member_number: string | null
  team_id: string | null
}

function firstRow<T>(data: T | T[] | null): T | null {
  if (data == null) return null
  return Array.isArray(data) ? data[0] ?? null : data
}

export async function fetchMiUsuarioPrivado(
  supabase: SupabaseClient
): Promise<{ row: MiUsuarioPrivadoRow | null; error: string | null }> {
  const { data, error } = await supabase.rpc('mi_usuario_privado')
  if (error) return { row: null, error: error.message }
  return { row: firstRow(data as MiUsuarioPrivadoRow[] | MiUsuarioPrivadoRow | null), error: null }
}

export async function fetchAdminUsuariosPrivados(
  supabase: SupabaseClient
): Promise<{ rows: MiUsuarioPrivadoRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc('admin_usuarios_privados')
  if (error) return { rows: [], error: error.message }
  const rows = Array.isArray(data) ? data : data ? [data as MiUsuarioPrivadoRow] : []
  return { rows: rows as MiUsuarioPrivadoRow[], error: null }
}

export async function fetchVerificarCredencial(
  supabase: SupabaseClient,
  userId: string
): Promise<{ row: VerificarCredencialRow | null; error: string | null }> {
  const { data, error } = await supabase.rpc('verificar_credencial', { p_id: userId })
  if (error) return { row: null, error: error.message }
  return {
    row: firstRow(data as VerificarCredencialRow[] | VerificarCredencialRow | null),
    error: null,
  }
}
