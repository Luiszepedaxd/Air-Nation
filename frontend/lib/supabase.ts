import { createBrowserClient } from '@supabase/ssr'

// Placeholders evitan que falle `next build`/prerender cuando no hay env (p. ej. sin vars en Vercel).
// En despliegue real: define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en el proyecto Vercel.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  'https://placeholder.supabase.co'
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

export const supabase = createBrowserClient(url, anonKey)
