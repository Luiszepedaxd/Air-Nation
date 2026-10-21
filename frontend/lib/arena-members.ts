import { tryCreateServiceRoleClient } from '@/app/admin/supabase-server'

/**
 * Los campos de ARENA los sube el admin, así que el dueño real casi nunca es
 * `fields.created_by`: la relación vive en `arena_field_members`, que no tiene
 * política de lectura pública (solo el service role la ve).
 *
 * Solo para Server Components. Sin `SUPABASE_SERVICE_KEY` devuelve vacío, que
 * deja el permiso exactamente como estaba antes de ARENA.
 */
export async function arenaMemberFieldIds(userId: string | null | undefined): Promise<string[]> {
  if (!userId) return []
  const svc = tryCreateServiceRoleClient()
  if (!svc) return []
  const { data, error } = await svc
    .from('arena_field_members')
    .select('field_id')
    .eq('user_id', userId)
    .eq('status', 'activo')
  if (error) {
    console.error('[arena] arena_field_members:', error.message)
    return []
  }
  return (data ?? []).map((r) => String((r as { field_id: string }).field_id))
}

export async function isArenaFieldMember(
  fieldId: string,
  userId: string | null | undefined
): Promise<boolean> {
  if (!userId || !fieldId) return false
  const svc = tryCreateServiceRoleClient()
  if (!svc) return false
  const { data, error } = await svc
    .from('arena_field_members')
    .select('id')
    .eq('field_id', fieldId)
    .eq('user_id', userId)
    .eq('status', 'activo')
    .maybeSingle()
  if (error) {
    console.error('[arena] arena_field_members:', error.message)
    return false
  }
  return Boolean(data)
}
