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
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          )
        },
      },
    }
  )
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  // Solo rutas privadas (no /u/*: esa ruta no está en el matcher y es pública)
  const requiresAuth =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    isAdminRoute ||
    pathname === '/campos/nuevo'

  if (!session && requiresAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && (
    pathname === '/login' ||
    pathname === '/register'
  )) return NextResponse.redirect(new URL('/dashboard', request.url))

  if (session && (isAdminRoute || pathname === '/campos/nuevo')) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('app_role')
      .eq('id', session.user.id)
      .single()

    const appRole =
      !error && profile?.app_role != null ? profile.app_role : 'player'

    if (isAdminRoute && appRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (
      pathname === '/campos/nuevo' &&
      appRole !== 'admin' &&
      appRole !== 'field_owner'
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
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
    '/login',
    '/register',
  ],
}
