"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ResetPasswordClient({
  loginFotoUrl,
}: {
  loginFotoUrl: string;
}) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionOk, setSessionOk] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let sub: { unsubscribe: () => void } | undefined;
    let failTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (ok: boolean) => {
      if (cancelled) return;
      setSessionOk(ok);
      setCheckingSession(false);
    };

    void (async () => {
      const {
        data: { session: first },
      } = await supabase.auth.getSession();
      if (first) {
        finish(true);
        return;
      }

      await new Promise((r) => setTimeout(r, 150));
      const {
        data: { session: second },
      } = await supabase.auth.getSession();
      if (second) {
        finish(true);
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          subscription.unsubscribe();
          if (failTimer) clearTimeout(failTimer);
          finish(true);
        }
      });
      sub = subscription;

      failTimer = setTimeout(async () => {
        subscription.unsubscribe();
        const {
          data: { session: last },
        } = await supabase.auth.getSession();
        finish(!!last);
      }, 2000);
    })();

    return () => {
      cancelled = true;
      sub?.unsubscribe();
      if (failTimer) clearTimeout(failTimer);
    };
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!password || !confirm) return;
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
  };

  const sidePanel = (
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
  );

  const header = (
    <Link href="/" className="mb-16 flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
        </svg>
      </span>
      <span
        style={{ fontFamily: "Jost,sans-serif" }}
        className="text-[1.1rem] font-black uppercase tracking-[0.18em] text-[#111111]"
      >
        AIR<span className="text-[#CC4B37]">NATION</span>
      </span>
    </Link>
  );

  return (
    <main className="flex min-h-screen bg-white">
      <div className="flex flex-1 flex-col justify-center px-8 py-16 sm:px-16 lg:px-24">
        {header}

        <div className="max-w-[400px]">
          {checkingSession ? (
            <p className="text-sm text-[#767676]">Verificando enlace…</p>
          ) : !sessionOk ? (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-[#CC4B37]">
                El enlace no es válido o ya expiró.
              </p>
              <p className="text-sm text-[#767676]">
                <Link
                  href="/forgot-password"
                  className="font-bold text-[#CC4B37] hover:underline"
                >
                  Solicitar un nuevo enlace
                </Link>
              </p>
            </div>
          ) : done ? (
            <div className="flex flex-col gap-6">
              <div className="flex h-12 w-12 items-center justify-center bg-[#CC4B37]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2
                style={{ fontFamily: "Jost,sans-serif" }}
                className="text-[2rem] font-black uppercase leading-[0.9] text-[#111111]"
              >
                CONTRASEÑA
                <br />
                ACTUALIZADA.
              </h2>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center bg-[#CC4B37] py-3.5 text-center text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#D95540]"
              >
                Ir a iniciar sesión →
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                Nueva contraseña
              </p>
              <h1
                style={{ fontFamily: "Jost,sans-serif" }}
                className="mb-10 text-[2.8rem] font-black uppercase leading-[0.9] text-[#111111]"
              >
                RESTABLECE
                <br />
                TU ACCESO.
              </h1>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444]">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-sm text-[#111111] placeholder-[#AAAAAA] transition-colors focus:border-[#CC4B37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444]">
                    Confirmar contraseña
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-sm text-[#111111] placeholder-[#AAAAAA] transition-colors focus:border-[#CC4B37] focus:outline-none"
                  />
                </div>
                {error && (
                  <p className="text-xs text-[#CC4B37]">{error}</p>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    loading || !password || !confirm || password.length < 6
                  }
                  className="mt-2 w-full bg-[#CC4B37] py-3.5 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#D95540] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar contraseña →"}
                </button>
              </div>

              <p className="mt-8 text-sm text-[#767676]">
                <Link
                  href="/login"
                  className="font-bold text-[#CC4B37] hover:underline"
                >
                  ← Volver a iniciar sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {sidePanel}
    </main>
  );
}
