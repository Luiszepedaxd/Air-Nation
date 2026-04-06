'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'

const VALID_ROLES = ['player', 'admin', 'field_owner'] as const

export async function updateUserRole(userId: string, newRole: string) {
  if (!VALID_ROLES.includes(newRole as (typeof VALID_ROLES)[number])) {
    return { error: 'Rol inválido' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('users')
    .update({ app_role: newRole })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
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
