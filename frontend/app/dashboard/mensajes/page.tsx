import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { BandejaClient } from './BandejaClient'

export default async function MensajesPage() {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Conversaciones 1:1 ──────────────────────────────────────────────────
  const { data: convRows } = await supabase
    .from('conversations')
    .select(`
      id, last_message, last_message_at, unread_1, unread_2,
      deleted_by_1, deleted_by_2,
      participant_1, participant_2,
      listing_id,
      u1:users!participant_1(id, alias, nombre, avatar_url),
      u2:users!participant_2(id, alias, nombre, avatar_url),
      listing:marketplace(id, titulo, fotos_urls)
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const conversations = (convRows ?? []).map(row => {
    const r = row as Record<string, unknown>
    const isP1 = String(r.participant_1) === user.id
    const other = isP1
      ? (Array.isArray(r.u2) ? r.u2[0] : r.u2) as Record<string, unknown>
      : (Array.isArray(r.u1) ? r.u1[0] : r.u1) as Record<string, unknown>
    const unread = isP1 ? Number(r.unread_1 ?? 0) : Number(r.unread_2 ?? 0)
    const deletedByMe = isP1 ? Boolean(r.deleted_by_1) : Boolean(r.deleted_by_2)
    const listing = Array.isArray(r.listing) ? r.listing[0] : r.listing as Record<string, unknown> | null

    return {
      id: String(r.id),
      last_message: (r.last_message as string | null) ?? null,
      last_message_at: (r.last_message_at as string | null) ?? null,
      unread,
      deletedByMe,
      other_user: {
        id: String(other?.id ?? ''),
        alias: other?.alias ? String(other.alias) : null,
        nombre: other?.nombre ? String(other.nombre) : null,
        avatar_url: other?.avatar_url ? String(other.avatar_url) : null,
      },
      listing: listing ? {
        id: String(listing.id ?? ''),
        titulo: String(listing.titulo ?? ''),
        foto: Array.isArray(listing.fotos_urls) ? String(listing.fotos_urls[0] ?? '') : null,
      } : null,
    }
  }).filter(c => !c.deletedByMe)

  // ── Grupos ───────────────────────────────────────────────────────────────
  const { data: memberRows } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (memberRows ?? []).map(r => (r as Record<string, unknown>).group_id as string)

  let groups: {
    id: string
    name: string
    avatar_url: string | null
    last_message: string | null
    last_message_at: string | null
    team_id: string | null
    unread: number
    member_count: number
  }[] = []

  if (groupIds.length > 0) {
    const { data: groupRows } = await supabase
      .from('group_conversations')
      .select('id, name, avatar_url, last_message, last_message_at, team_id')
      .in('id', groupIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    const groupsWithMeta = await Promise.all((groupRows ?? []).map(async row => {
      const r = row as Record<string, unknown>
      const groupId = String(r.id)

      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      const { data: readRow } = await supabase
        .from('group_message_reads')
        .select('last_read_at')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle()

      let unread = 0
      const lastReadAt = (readRow as Record<string, unknown> | null)?.last_read_at as string | null
      if (lastReadAt) {
        const { count } = await supabase
          .from('group_messages')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .neq('sender_id', user.id)
          .gt('created_at', lastReadAt)
        unread = count ?? 0
      } else {
        const { count } = await supabase
          .from('group_messages')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .neq('sender_id', user.id)
        unread = count ?? 0
      }

      return {
        id: groupId,
        name: String(r.name ?? ''),
        avatar_url: (r.avatar_url as string | null) ?? null,
        last_message: (r.last_message as string | null) ?? null,
        last_message_at: (r.last_message_at as string | null) ?? null,
        team_id: (r.team_id as string | null) ?? null,
        unread,
        member_count: memberCount ?? 0,
      }
    }))

    groups = groupsWithMeta
  }

  return (
    <BandejaClient
      currentUserId={user.id}
      conversations={conversations}
      groups={groups}
    />
  )
}
