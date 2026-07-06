import { createServerClient, type CookieMethodsServerDeprecated } from '@supabase/ssr'
import { cookies } from 'next/headers'
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
  const next = searchParams.get('next') // ruta post-login opcional (ej: /store/pedidos)

  if (code) {
    const cookieStore = cookies()
    const cookieAdapter: CookieMethodsServerDeprecated = {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        cookieStore.set(name, value, options)
      },
      remove: (name, options) => {
        cookieStore.set(name, '', options)
      },
    }
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieAdapter }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('alias')
          .eq('id', user.id)
          .single()

        // Sin alias → onboarding pendiente (usuario nuevo, cualquier provider)
        if (!profile?.alias) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      // Respetar ?next= solo si es ruta interna válida
      const destination = isSafeInternalPath(next) ? next : '/dashboard'
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // Código inválido o expirado
  return NextResponse.redirect(`${origin}/register?error=auth`)
}
