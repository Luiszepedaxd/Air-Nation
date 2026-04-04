"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RegisterClient({
  registerImageSrc,
}: {
  registerImageSrc: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={loading || !email || !password}
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
