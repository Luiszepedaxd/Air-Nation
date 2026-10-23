'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'

const VALID_ROLES = ['player', 'admin', 'field_owner'] as const

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

export async function updateUserRole(userId: string, newRole: string) {
  if (!VALID_ROLES.includes(newRole as (typeof VALID_ROLES)[number])) {
    return { error: 'Rol inválido' }
  }

  const authClient = createAdminSupabaseServerClient()
  const {
    data: { session },
  } = await authClient.auth.getSession()
  if (!session?.access_token) {
    return { error: 'No autenticado' }
  }

  const res = await fetch(
    `${API_URL}/admin/users/${encodeURIComponent(userId)}/role`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ app_role: newRole }),
    }
  )
  const body = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    return { error: body.error || `Error ${res.status}` }
  }

  revalidatePath('/admin/usuarios')
  return { success: true as const }
}

export async function deleteUser(
  userId: string
): Promise<{ success: true } | { error: string }> {
  const trimmed = userId?.trim() ?? ''
  if (!trimmed) {
    return { error: 'ID no válido' }
  }

  const authClient = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user?.id) {
    return { error: 'No autenticado' }
  }
  if (user.id === trimmed) {
    return { error: 'No puedes eliminar tu propia cuenta' }
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(trimmed)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/usuarios')
  return { success: true as const }
}
