import { redirect, notFound } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../../../supabase-server'
import { GrupoConversacionClient } from './GrupoConversacionClient'

export default async function GrupoConversacionPage({ params }: { params: { id: string } }) {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar que el usuario es miembro del grupo
  const { data: memberRow } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!memberRow) notFound()

  // Datos del grupo
  const { data: group } = await supabase
    .from('group_conversations')
    .select('id, name, avatar_url, team_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!group) notFound()

  const g = group as Record<string, unknown>

  // Miembros del grupo con sus datos
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id, role, users(id, alias, nombre, avatar_url)')
    .eq('group_id', params.id)

  const members = (membersRaw ?? []).map(row => {
    const r = row as Record<string, unknown>
    const u = Array.isArray(r.users) ? r.users[0] : r.users as Record<string, unknown>
    return {
      user_id: String(r.user_id),
      role: String(r.role),
      alias: u?.alias ? String(u.alias) : null,
      nombre: u?.nombre ? String(u.nombre) : null,
      avatar_url: u?.avatar_url ? String(u.avatar_url) : null,
    }
  })

  // Mensajes iniciales (últimos 100)
  const { data: msgs } = await supabase
    .from('group_messages')
    .select('id, sender_id, content, image_url, created_at')
    .eq('group_id', params.id)
    .order('created_at', { ascending: true })
    .limit(100)

  // Marcar como leído
  await supabase
    .from('group_message_reads')
    .upsert(
      { user_id: user.id, group_id: params.id, last_read_at: new Date().toISOString() },
      { onConflict: 'user_id,group_id' }
    )

  return (
    <GrupoConversacionClient
      groupId={params.id}
      groupName={String(g.name ?? '')}
      groupAvatar={(g.avatar_url as string | null) ?? null}
      teamId={(g.team_id as string | null) ?? null}
      currentUserId={user.id}
      currentUserRole={(memberRow as Record<string, unknown>).role as string}
      members={members}
      initialMessages={(msgs ?? []).map(m => {
        const mr = m as Record<string, unknown>
        return {
          id: String(mr.id),
          sender_id: String(mr.sender_id),
          content: String(mr.content ?? ''),
          image_url: mr.image_url != null && String(mr.image_url).trim() !== ''
            ? String(mr.image_url)
            : null,
          created_at: String(mr.created_at ?? ''),
        }
      })}
    />
  )
}
