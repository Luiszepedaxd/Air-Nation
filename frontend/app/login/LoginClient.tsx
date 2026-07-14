"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

export default function LoginClient({
  loginFotoUrl,
}: {
  loginFotoUrl: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setGoogleLoading(true)
    setError('')

    try {
      const isNative =
        typeof window !== 'undefined' &&
        (window as any).Capacitor?.isNativePlatform?.()

      const redirect = searchParams.get('redirect')
      const isSafeRedirect =
        typeof redirect === 'string' &&
        redirect.startsWith('/') &&
        !redirect.startsWith('//')

      if (isNative) {
        // App nativa: interceptar callback dentro del WebView
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: 'https://www.airnation.online/auth/callback',
            skipBrowserRedirect: true,
          },
        })

        if (error) {
          setError(error.message)
          setGoogleLoading(false)
          return
        }

        if (!data?.url) {
          setError('No se pudo iniciar sesión')
          setGoogleLoading(false)
          return
        }

        const { InAppBrowser } = await import('@capacitor/inappbrowser')

        // Listener que intercepta la navegación al callback
        const navListener = await InAppBrowser.addListener(
          'browserPageNavigationCompleted',
          async (event) => {
            const navUrl = event?.url ?? ''
            // Detectar la URL de callback con el code
            if (navUrl.includes('/auth/callback') && navUrl.includes('code=')) {
              try {
                const urlObj = new URL(navUrl)
                const code = urlObj.searchParams.get('code')

                // Cerrar el WebView
                await InAppBrowser.close()
                await navListener.remove()

                if (!code) {
                  setError('No se recibió código de autorización')
                  setGoogleLoading(false)
                  return
                }

                // Crear sesión
                const { error: exchangeError } =
                  await supabase.auth.exchangeCodeForSession(code)

                if (exchangeError) {
                  setError(exchangeError.message)
                  setGoogleLoading(false)
                  return
                }

                // Decidir destino
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                  const { data: profile } = await supabase
                    .from('users')
                    .select('alias')
                    .eq('id', user.id)
                    .single()
                  window.location.href = !profile?.alias ? '/onboarding' : '/dashboard'
                } else {
                  window.location.href = '/dashboard'
                }
              } catch (err: any) {
                console.error('[OAuth] error procesando callback:', err)
                setError('Error al completar el inicio de sesión')
                setGoogleLoading(false)
              }
            }
          }
        )

        // Abrir OAuth dentro del WebView
        await InAppBrowser.openInWebView({
          url: data.url,
          options: {
            showURL: false,
            showToolbar: true,
            clearCache: true,
            clearSessionCache: true,
            closeButtonText: 'Cancelar',
          } as any,
        })
      } else {
        // Web: flujo OAuth normal
        const redirectTo = isSafeRedirect
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect!)}`
          : `${window.location.origin}/auth/callback`
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        })
        if (error) {
          setError(error.message)
          setGoogleLoading(false)
        }
      }
    } catch (err: any) {
      console.error(`${provider} Sign In error:`, err)
      setError(err?.message || `Error al iniciar sesión con ${provider}`)
      setGoogleLoading(false)
    }
  }

  const handleGoogleSignIn = () => handleOAuthSignIn('google')
  const handleAppleSignIn = () => handleOAuthSignIn('apple')

  const handleLogin = async () => {
    if (!email || !password) return;
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const redirect = searchParams.get("redirect");
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      router.push(redirect);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-8 py-16 sm:px-16 lg:px-24">
        <Link href="/" className="mb-16 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
                fill="#fff"
              />
            </svg>
          </span>
          <span
            style={{ fontFamily: "Jost,sans-serif" }}
            className="text-[1.1rem] font-black uppercase tracking-[0.18em] text-[#111111]"
          >
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </Link>

        <div className="max-w-[400px]">
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
            Iniciar sesión
          </p>
          <h1
            style={{ fontFamily: "Jost,sans-serif" }}
            className="mb-10 text-[2.8rem] font-black uppercase leading-[0.9] text-[#111111]"
          >
            BIENVENIDO
            <br />
            DE VUELTA.
          </h1>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="flex w-full items-center justify-center gap-3 border border-[#DDDDDD] bg-white py-3.5 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#111111] transition-colors hover:bg-[#F4F4F4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {googleLoading ? (
                "Redirigiendo..."
              ) : (
                <>
                  <GoogleIcon />
                  Continuar con Google
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={googleLoading || loading}
              className="flex w-full items-center justify-center gap-3 border border-[#DDDDDD] bg-black py-3.5 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {googleLoading ? (
                "Redirigiendo..."
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continuar con Apple
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#EEEEEE]" />
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#AAAAAA]">
                O
              </span>
              <div className="h-px flex-1 bg-[#EEEEEE]" />
            </div>

            <div>
              <label className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444]">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-sm text-[#111111] placeholder-[#AAAAAA] transition-colors focus:border-[#CC4B37] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444]">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-sm text-[#111111] placeholder-[#AAAAAA] transition-colors focus:border-[#CC4B37] focus:outline-none"
              />
            </div>
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#767676] hover:text-[#CC4B37] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            {error && <p className="text-xs text-[#CC4B37]">{error}</p>}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || googleLoading || !email || !password}
              className="mt-2 w-full bg-[#CC4B37] py-3.5 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#D95540] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar →"}
            </button>
          </div>

          <p className="mt-8 text-sm text-[#767676]">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-bold text-[#CC4B37] hover:underline"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>

      <div className="relative sticky top-0 hidden h-screen w-[45%] overflow-hidden bg-[#111111] lg:block">
        <img
          src={loginFotoUrl}
          alt=""
          className="h-full w-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
        <div className="absolute bottom-12 left-10 right-10">
          <p
            style={{ fontFamily: "Jost,sans-serif" }}
            className="font-black text-2xl uppercase leading-tight text-white"
          >
            &quot;LA PLATAFORMA QUE
            <br />
            LA COMUNIDAD
            <br />
            NECESITABA.&quot;
          </p>
        </div>
      </div>
    </main>
  );
}
