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

function registroTime(value: string | null | undefined): number {
  const t = value ? Date.parse(value) : Number.NaN
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY
}

/** Newest created_at first. Missing or invalid dates go last. */
export function compareRegistroDesc(
  a: { created_at?: string | null },
  b: { created_at?: string | null }
): number {
  const av = registroTime(a.created_at)
  const bv = registroTime(b.created_at)
  if (av === bv) return 0
  return bv - av
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
  const rows = (
    Array.isArray(data) ? data : data ? [data] : []
  ) as MiUsuarioPrivadoRow[]
  // ponytail: RPC has no ORDER BY and its SQL is not in this repo, so the full
  // payload is sorted here (same rows the admin already loaded). Upgrade: ORDER BY
  // created_at DESC inside admin_usuarios_privados, then delete this sort.
  rows.sort(compareRegistroDesc)
  return { rows, error: null }
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
