import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isSafeInternalPath(path: string | null): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//')
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  console.log('[auth/callback] code present:', !!code, '| origin:', origin)

  if (!code) {
    return NextResponse.redirect(new URL('/register?error=auth', origin))
  }

  const cookiesToSet: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(incoming) {
          incoming.forEach((c) => cookiesToSet.push(c))
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  console.log('[auth/callback] exchangeCodeForSession error:', error?.message ?? null)
  console.log('[auth/callback] cookies to set:', cookiesToSet.map(c => c.name))

  let destination: string

  if (error) {
    destination = '/register?error=auth'
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[auth/callback] user id:', user?.id ?? null)

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('alias')
        .eq('id', user.id)
        .single()

      console.log('[auth/callback] profile alias:', profile?.alias ?? null, '| profileError:', profileError?.message ?? null)

      destination = !profile?.alias
        ? '/onboarding'
        : isSafeInternalPath(next)
          ? next
          : '/dashboard'
    } else {
      destination = isSafeInternalPath(next) ? next : '/dashboard'
    }
  }

  console.log('[auth/callback] redirecting to:', destination)

  const response = NextResponse.redirect(new URL(destination, origin))
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  console.log('[auth/callback] response cookies set:', cookiesToSet.length)
  return response
}
