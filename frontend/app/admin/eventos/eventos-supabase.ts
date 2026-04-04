import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'

export type EventosActor = 'admin' | 'field_owner'

export type EventosModuleOk =
  | { supabase: SupabaseClient; role: 'admin'; userId: string }
  | { supabase: SupabaseClient; role: 'field_owner'; userId: string }

export type EventosModuleResult = EventosModuleOk | { error: string }

export async function getSupabaseForEventosModule(): Promise<EventosModuleResult> {
  const userClient = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return { error: 'no_session' }

  const { data: profile } = await userClient
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.app_role
  if (role === 'admin') {
    return { supabase: createAdminClient(), role: 'admin', userId: user.id }
  }
  if (role === 'field_owner') {
    return { supabase: userClient, role: 'field_owner', userId: user.id }
  }
  return { error: 'forbidden' }
}
