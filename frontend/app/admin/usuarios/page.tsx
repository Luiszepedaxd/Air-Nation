import { createAdminClient } from '../supabase-server'
import UsersTable, { type User } from './UsersTable'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminUsuariosPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select(
      'id, nombre, alias, email, ciudad, rol, app_role, member_number, created_at'
    )
    .order('created_at', { ascending: false })

  const users: User[] =
    !error && data
      ? (data as User[])
      : []

  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        USUARIOS
      </h1>
      <UsersTable users={users} />
    </div>
  )
}
