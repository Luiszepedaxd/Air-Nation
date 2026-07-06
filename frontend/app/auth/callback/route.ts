import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Valida que el destino sea una ruta interna — previene open redirect */
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
  const next = searchParams.get('next') // ruta post-login opcional

  if (!code) {
    return NextResponse.redirect(new URL('/register?error=auth', origin))
  }

  // Acumulamos las cookies que Supabase necesita escribir
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

  let destination: string

  if (error) {
    destination = '/register?error=auth'
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('alias')
        .eq('id', user.id)
        .single()

      // Sin alias → onboarding (usuario nuevo, cualquier provider)
      destination = !profile?.alias
        ? '/onboarding'
        : isSafeInternalPath(next)
          ? next
          : '/dashboard'
    } else {
      destination = isSafeInternalPath(next) ? next : '/dashboard'
    }
  }

  // Crear el redirect y transferir las cookies de sesión al response
  const response = NextResponse.redirect(new URL(destination, origin))
  cookiesToSet.forEach(({ name, value, options }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set(name, value, options as any)
  })

  return response
}
