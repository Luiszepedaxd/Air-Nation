import { redirect, notFound } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../../../../supabase-server'
import { GrupoInfoClient } from './GrupoInfoClient'

export default async function GrupoInfoPage({ params }: { params: { id: string } }) {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar membresía
  const { data: memberRow } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!memberRow) notFound()

  const { data: group } = await supabase
    .from('group_conversations')
    .select('id, name, avatar_url, team_id, created_by')
    .eq('id', params.id)
    .maybeSingle()

  if (!group) notFound()

  const g = group as Record<string, unknown>

  // Miembros con perfil
  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at, users(id, alias, nombre, avatar_url)')
    .eq('group_id', params.id)
    .order('joined_at', { ascending: true })

  const members = (membersRaw ?? []).map(row => {
    const r = row as Record<string, unknown>
    const u = Array.isArray(r.users) ? r.users[0] : r.users as Record<string, unknown>
    return {
      user_id: String(r.user_id),
      role: String(r.role),
      joined_at: String(r.joined_at ?? ''),
      alias: u?.alias ? String(u.alias) : null,
      nombre: u?.nombre ? String(u.nombre) : null,
      avatar_url: u?.avatar_url ? String(u.avatar_url) : null,
    }
  })

  const mr = memberRow as Record<string, unknown>

  return (
    <GrupoInfoClient
      groupId={params.id}
      groupName={String(g.name ?? '')}
      groupAvatar={(g.avatar_url as string | null) ?? null}
      teamId={(g.team_id as string | null) ?? null}
      currentUserId={user.id}
      currentUserRole={String(mr.role)}
      members={members}
    />
  )
}
