export const dynamic = 'force-dynamic'

import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'
import UsersTable, { type User } from './UsersTable'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminUsuariosPage() {
  const supabase = createAdminClient()
  const sessionClient = createAdminSupabaseServerClient()
  const {
    data: { user: sessionUser },
  } = await sessionClient.auth.getUser()

  const [{ data, error }, { data: authData }] = await Promise.all([
    supabase
      .from('users')
      .select('id, nombre, alias, email, ciudad, rol, app_role, member_number, created_at')
      .order('created_at', { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ])

  // Mapa id → provider desde auth.users
  const providerMap = new Map<string, string>()
  for (const au of authData?.users ?? []) {
    const provider = au.app_metadata?.provider ?? null
    if (provider) providerMap.set(au.id, provider)
  }

  const users: User[] =
    !error && data
      ? (data as Omit<User, 'provider'>[]).map((u) => ({
          ...u,
          provider: providerMap.get(u.id) ?? null,
        }))
      : []

  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        USUARIOS
      </h1>
      <UsersTable users={users} currentUserId={sessionUser?.id ?? null} />
    </div>
  )
}
