import { supabase } from '@/lib/supabase'

/**
 * Crea un bloqueo. Si ya existe, no hace nada (idempotente).
 */
export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (blockerId === blockedId) {
    return { ok: false, error: 'No puedes bloquearte a ti mismo' }
  }
  const { error } = await supabase.from('user_blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  })
  // Código 23505 = duplicate key (ya estaba bloqueado), tratamos como éxito
  if (error && error.code !== '23505') {
    console.error('[user-blocks] block error:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/**
 * Elimina un bloqueo. Si no existía, no hace nada.
 */
export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
  if (error) {
    console.error('[user-blocks] unblock error:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/**
 * Verifica si A bloqueó a B (one-way).
 */
export async function isBlockedBy(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle()
  return !!data
}

/**
 * Devuelve todos los IDs de usuarios que están en una relación de bloqueo
 * con el usuario actual (tanto los que TÚ bloqueaste como los que te bloquearon).
 * Útil para filtrar feeds: si está aquí, NO debes ver su contenido.
 */
export async function getBlockedUserIds(
  currentUserId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`)

  if (error) {
    console.error('[user-blocks] getBlockedUserIds error:', error)
    return new Set()
  }

  const ids = new Set<string>()
  for (const row of data ?? []) {
    const r = row as { blocker_id: string; blocked_id: string }
    if (r.blocker_id !== currentUserId) ids.add(r.blocker_id)
    if (r.blocked_id !== currentUserId) ids.add(r.blocked_id)
  }
  return ids
}
