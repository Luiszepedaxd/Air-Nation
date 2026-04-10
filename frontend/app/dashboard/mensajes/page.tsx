import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { BandejaClient } from './BandejaClient'

export default async function MensajesPage() {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
  }).filter(c => !c.deletedByMe || (c.unread > 0))

  return (
    <BandejaClient
      currentUserId={user.id}
      conversations={conversations}
    />
  )
}
