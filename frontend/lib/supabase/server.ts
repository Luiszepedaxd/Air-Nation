import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  'https://placeholder.supabase.co'
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

export function createClient() {
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
