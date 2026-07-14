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
  const oauthError = searchParams.get('error')
  const oauthErrorCode = searchParams.get('error_code')
  const isNative = searchParams.get('native') === '1'

  // Supabase redirige aquí con ?error= cuando el OAuth falla (ej: identity_already_linked)
  if (oauthError) {
    const safeNext = isSafeInternalPath(next) ? next : '/dashboard/perfil?tab=configuracion'
    const errorParam = `oauth_error=${encodeURIComponent(oauthErrorCode ?? oauthError)}`
    return NextResponse.redirect(new URL(`${safeNext}&${errorParam}`, origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/register?error=auth', origin))
  }

  if (isNative && code) {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Redirigiendo...</title></head>
<body style="font-family:sans-serif;text-align:center;padding-top:40vh;">
<p>Regresando a AirNation...</p>
<script>
  window.location.href = 'airnation://auth/callback?code=${encodeURIComponent(code)}';
</script>
</body></html>`
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
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

  let destination: string

  if (error) {
    destination = '/register?error=auth'
  } else {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('alias')
        .eq('id', user.id)
        .single()

      destination = !profile?.alias
        ? '/onboarding'
        : isSafeInternalPath(next)
          ? next
          : '/dashboard'
    } else {
      destination = isSafeInternalPath(next) ? next : '/dashboard'
    }
  }

  const response = NextResponse.redirect(new URL(destination, origin))
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
