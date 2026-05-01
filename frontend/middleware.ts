import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Detecta si la request viene de la app nativa Capacitor.
 * Capacitor por default agrega su nombre al User Agent. Adicionalmente
 * configuramos un suffix custom 'AirNationApp' en capacitor.config.ts
 * para hacer la detección más robusta.
 */
function isCapacitorRequest(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') || ''
  return /AirNationApp|Capacitor/i.test(ua)
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    'https://placeholder.supabase.co'
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  const supabase = createServerClient(url, anonKey, {
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
  })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isCapacitor = isCapacitorRequest(request)

  // /welcome — pantalla bienvenida exclusiva de app nativa.
  // - Con sesión → /dashboard (no tiene sentido ver welcome si ya estás logueado).
  // - Sin sesión y NO es Capacitor → / (en web no aplica welcome).
  // - Sin sesión y SÍ es Capacitor → renderiza welcome.
  if (pathname === '/welcome') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (!isCapacitor) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

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
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Usuarios logueados: '/' '/login' '/register' → '/dashboard'
  if (
    session &&
    (pathname === '/' || pathname === '/login' || pathname === '/register')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Usuarios SIN sesión que abren '/' desde la app nativa → '/welcome'
  // (en web normal sin sesión, '/' renderiza la landing pública como siempre).
  if (!session && pathname === '/' && isCapacitor) {
    return NextResponse.redirect(new URL('/welcome', request.url))
  }

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
    '/',
    '/welcome',
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
