import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  'https://placeholder.supabase.co'
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

export function createAdminClient() {
  const serviceUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    'https://placeholder.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim()
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_KEY no está configurada')
  }
  return createClient(serviceUrl, serviceKey)
}

/** Cliente con rol de servicio solo si la key existe (evita fallos opacos en build). */
export function tryCreateServiceRoleClient(): ReturnType<
  typeof createClient
> | null {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim()
  if (!serviceUrl || !serviceKey) return null
  return createClient(serviceUrl, serviceKey)
}

export function createAdminSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          /* Server Component: cookies() puede ser de solo lectura */
        }
      },
    },
  })
}
