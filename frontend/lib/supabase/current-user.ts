import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from './server'

/**
 * Request-scoped `auth.getUser()`.
 *
 * `getUser()` hits Supabase over the network to verify the JWT, so calling it
 * once in a layout and again in the page doubled that round-trip on every
 * navigation. `cache()` dedupes it for the lifetime of a single request.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
