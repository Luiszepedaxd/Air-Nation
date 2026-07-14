"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
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

export default function RegisterClient({
  registerImageSrc,
}: {
  registerImageSrc: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const isNative =
        typeof window !== "undefined" &&
        (window as any).Capacitor?.isNativePlatform?.();
      const platform =
        typeof window !== "undefined" &&
        (window as any).Capacitor?.getPlatform?.();

      if (isNative && platform === "ios") {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: {
            skipBrowserRedirect: true,
          },
        });

        console.log("Apple OAuth data:", JSON.stringify(data));

        if (error) {
          console.error("Apple OAuth error:", error);
          setError(error.message);
          setGoogleLoading(false);
          return;
        }

        if (data?.url) {
          window.location.href = data.url;
        }
        return;
      } else {
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: { redirectTo },
        });
        if (error) {
          setError(error.message);
          setGoogleLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Apple Sign In error:", err);
      setError(err?.message || "Error al iniciar sesión con Apple");
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) return;
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
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
          {sent ? (
            <div className="flex flex-col gap-6">
              <div className="flex h-12 w-12 items-center justify-center bg-[#CC4B37]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 8l9 6 9-6M3 8v10a1 1 0 001 1h16a1 1 0 001-1V8M3 8a1 1 0 011-1h16a1 1 0 011 1"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2
                style={{ fontFamily: "Jost,sans-serif" }}
                className="text-[2rem] font-black uppercase leading-[0.9] text-[#111111]"
              >
                REVISA TU
                <br />
                CORREO.
              </h2>
              <p className="text-sm leading-relaxed text-[#444444]">
                Te enviamos un link a <strong>{email}</strong>.
                <br />
                Haz click en él para activar tu cuenta y continuar.
              </p>
              <p className="text-xs text-[#AAAAAA]">
                ¿No lo ves? Revisa tu carpeta de spam.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                Crear cuenta
              </p>
              <h1
                style={{ fontFamily: "Jost,sans-serif" }}
                className="mb-10 text-[2.8rem] font-black uppercase leading-[0.9] text-[#111111]"
              >
                EMPIEZA
                <br />
                GRATIS.
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
                {error && <p className="text-xs text-[#CC4B37]">{error}</p>}
                <p className="text-[0.7rem] leading-relaxed text-[#767676]">
                  Al crear cuenta aceptas los{" "}
                  <Link
                    href="/terminos"
                    className="font-semibold text-[#CC4B37] hover:underline"
                  >
                    Términos y Condiciones
                  </Link>{" "}
                  y el{" "}
                  <Link
                    href="/privacidad"
                    className="font-semibold text-[#CC4B37] hover:underline"
                  >
                    Aviso de Privacidad
                  </Link>
                  .
                </p>
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading || googleLoading || !email || !password}
                  className="mt-2 w-full bg-[#CC4B37] py-3.5 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#D95540] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta →"}
                </button>
              </div>

              <p className="mt-8 text-sm text-[#767676]">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[#CC4B37] hover:underline"
                >
                  Iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="relative sticky top-0 hidden h-screen w-[45%] overflow-hidden bg-[#111111] lg:block">
        <img
          src={registerImageSrc}
          alt=""
          className="h-full w-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
        <div className="absolute bottom-12 left-10 right-10">
          <p
            style={{ fontFamily: "Jost,sans-serif" }}
            className="text-2xl font-black uppercase leading-tight text-white"
          >
            “LA PLATAFORMA QUE
            <br />
            LA COMUNIDAD
            <br />
            NECESITABA.”
          </p>
        </div>
      </div>
    </main>
  );
}
