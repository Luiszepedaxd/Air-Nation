import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

/**
 * Cliente Supabase con anon key sin cookies/sesión.
 * Úsalo cuando NO quieras que Supabase intente leer la sesión del usuario
 * (por ejemplo, en server actions que pueden ser ejecutados por invitados).
 *
 * Las RLS policies se evalúan como si fuera un usuario anónimo.
 */
export function createAnonSupabaseClient() {
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
