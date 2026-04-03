'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'

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
