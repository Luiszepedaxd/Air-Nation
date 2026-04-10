import { redirect, notFound } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../../supabase-server'
import { ConversacionClient } from './ConversacionClient'

export default async function ConversacionPage({ params }: { params: { id: string } }) {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      id, participant_1, participant_2, listing_id,
      u1:users!participant_1(id, alias, nombre, avatar_url),
      u2:users!participant_2(id, alias, nombre, avatar_url),
      listing:marketplace(id, titulo, fotos_urls)
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!conv) notFound()

  const r = conv as Record<string, unknown>
  const isP1 = String(r.participant_1) === user.id
  if (!isP1 && String(r.participant_2) !== user.id) notFound()

  const other = isP1
    ? (Array.isArray(r.u2) ? r.u2[0] : r.u2) as Record<string, unknown>
    : (Array.isArray(r.u1) ? r.u1[0] : r.u1) as Record<string, unknown>

  const listing = r.listing
    ? (Array.isArray(r.listing) ? r.listing[0] : r.listing) as Record<string, unknown>
    : null

  const { data: msgs } = await supabase
    .from('messages')
    .select('id, content, sender_id, read, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(100)

  await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', params.id)
    .neq('sender_id', user.id)
    .eq('read', false)

  const field = isP1 ? 'unread_1' : 'unread_2'
  await supabase.from('conversations').update({ [field]: 0 }).eq('id', params.id)

  return (
    <ConversacionClient
      conversationId={params.id}
      currentUserId={user.id}
      otherUser={{
        id: String(other?.id ?? ''),
        alias: other?.alias ? String(other.alias) : null,
        nombre: other?.nombre ? String(other.nombre) : null,
        avatar_url: other?.avatar_url ? String(other.avatar_url) : null,
      }}
      listing={listing ? {
        id: String(listing.id ?? ''),
        titulo: String(listing.titulo ?? ''),
        foto: Array.isArray(listing.fotos_urls) ? String(listing.fotos_urls[0] ?? '') : null,
      } : null}
      initialMessages={(msgs ?? []).map(m => {
        const mr = m as Record<string, unknown>
        return {
          id: String(mr.id),
          content: String(mr.content ?? ''),
          sender_id: String(mr.sender_id ?? ''),
          read: Boolean(mr.read),
          created_at: String(mr.created_at ?? ''),
        }
      })}
    />
  )
}
