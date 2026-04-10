import type { SupabaseClient } from '@supabase/supabase-js'

export const NOTIF_UPDATED_EVENT = 'airnation:notif-updated'

export function notifyNotifUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIF_UPDATED_EVENT))
  }
}

export async function fetchUnreadNotifCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('read', false)
  return count ?? 0
}

export async function markAllNotifsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await supabase
    .from('user_notifications')
    .update({ read: true })
    .eq('recipient_id', userId)
    .eq('read', false)
}

export type UserNotifRow = {
  id: string
  type: 'like_post' | 'comment_post' | 'like_comment'
  post_type: 'player' | 'team' | 'field' | 'comment' | null
  post_id: string | null
  comment_id: string | null
  href: string | null
  read: boolean
  created_at: string
  actor: {
    alias: string | null
    nombre: string | null
    avatar_url: string | null
  }
}

export async function fetchUserNotifs(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<UserNotifRow[]> {
  const { data } = await supabase
    .from('user_notifications')
    .select(`
      id, type, post_type, post_id, comment_id, href, read, created_at,
      actor:users!actor_id ( alias, nombre, avatar_url )
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []
  return (data as Record<string, unknown>[]).map(r => {
    const a = Array.isArray(r.actor) ? r.actor[0] : r.actor
    const ao = (a ?? {}) as Record<string, unknown>
    return {
      id: String(r.id),
      type: r.type as UserNotifRow['type'],
      post_type: (r.post_type as UserNotifRow['post_type']) ?? null,
      post_id: r.post_id ? String(r.post_id) : null,
      comment_id: r.comment_id ? String(r.comment_id) : null,
      href: r.href ? String(r.href) : null,
      read: Boolean(r.read),
      created_at: String(r.created_at),
      actor: {
        alias: ao.alias ? String(ao.alias) : null,
        nombre: ao.nombre ? String(ao.nombre) : null,
        avatar_url: ao.avatar_url ? String(ao.avatar_url) : null,
      },
    }
  })
}

export async function deleteNotif(
  supabase: SupabaseClient,
  notifId: string
): Promise<void> {
  await supabase
    .from('user_notifications')
    .delete()
    .eq('id', notifId)
}
