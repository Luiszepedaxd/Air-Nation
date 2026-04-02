import AdminShell from './AdminShell'
import { createAdminSupabaseServerClient } from './supabase-server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const meta = user?.user_metadata as Record<string, unknown> | undefined
  const fromMeta =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    ''

  const displayName =
    (fromMeta as string) || user?.email || 'Administrador'

  return <AdminShell displayName={displayName}>{children}</AdminShell>
}
