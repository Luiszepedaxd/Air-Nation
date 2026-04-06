import { redirect } from 'next/navigation'
import { createAdminClient, createAdminSupabaseServerClient } from './supabase-server'

/** Devuelve el id del usuario autenticado solo si `users.app_role` es `admin`. */
export async function requireAppAdminUserId(): Promise<string | null> {
  const auth = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user?.id) return null

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  if ((row as { app_role?: string } | null)?.app_role !== 'admin') return null
  return user.id
}

/** Uso en páginas Server Components del panel admin. */
export async function ensureAppAdminOrRedirect(
  returnPath: string
): Promise<string> {
  const auth = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user?.id) {
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`)
  }
  const id = await requireAppAdminUserId()
  if (!id) {
    redirect('/')
  }
  return id
}
