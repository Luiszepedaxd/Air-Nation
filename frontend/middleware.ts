import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    'https://placeholder.supabase.co'
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/dashboard/credencial')) {
    console.error('[middleware:credencial] hit', {
      pathname,
      hasSession: !!session,
      sessionUserId: session?.user?.id ?? null,
    })
  }
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  // /equipos/* no está en el matcher: no toca cookies de sesión; queda público salvo lógica en página.
  // Solo rutas privadas (perfiles públicos /u/[id] no están en el matcher y son públicos)
  const requiresAuth =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    isAdminRoute ||
    pathname === '/campos/nuevo' ||
    pathname === '/eventos/nuevo'

  if (!session && requiresAuth) {
    if (pathname === '/campos/nuevo') {
      return NextResponse.redirect(
        new URL('/login?redirect=/campos/nuevo', request.url)
      )
    }
    if (pathname === '/eventos/nuevo') {
      return NextResponse.redirect(
        new URL('/login?redirect=/eventos/nuevo', request.url)
      )
    }
    console.error('[middleware] redirecting to /login', { pathname, hasSession: !!session })
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && (
    pathname === '/login' ||
    pathname === '/register'
  )) return NextResponse.redirect(new URL('/dashboard', request.url))

  // /campos/nuevo: solo exige sesión (arriba). Cualquier usuario registrado puede registrar un campo.
  if (session && isAdminRoute) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('app_role')
      .eq('id', session.user.id)
      .single()

    const appRole =
      !error && profile?.app_role != null ? profile.app_role : 'player'

    const isEventosAdminPath =
      pathname === '/admin/eventos' || pathname.startsWith('/admin/eventos/')

    if (appRole !== 'admin') {
      const allowFieldOwnerEventos =
        appRole === 'field_owner' && isEventosAdminPath
      if (!allowFieldOwnerEventos) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/admin',
    '/admin/:path*',
    '/campos/nuevo',
    '/eventos/nuevo',
    '/login',
    '/register',
  ],
}
