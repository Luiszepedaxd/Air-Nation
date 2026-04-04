"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { TeamForm } from "./TeamForm";

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

export default function NuevoEquipoPage() {
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setAuthReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!authReady) {
    return (
      <main className="flex min-h-screen min-w-[375px] items-center justify-center bg-[#FFFFFF]">
        <div className="h-10 w-48 animate-pulse bg-[#F4F4F4]" aria-hidden />
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] px-6 py-10 text-[#111111]">
        <div className="mx-auto max-w-[480px]">
          <h1
            className="text-[22px] font-extrabold leading-tight text-[#111111] md:text-[26px]"
            style={jostHeading}
          >
            Nuevo equipo
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#666666]">
            Inicia sesión para registrar un equipo en AirNation.
          </p>
          <Link
            href="/login?redirect=/equipos/nuevo"
            className="mt-6 inline-block rounded-[2px] bg-[#CC4B37] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white"
            style={jostHeading}
          >
            Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] px-6 py-10 text-[#111111]">
      <TeamForm userId={userId} />
    </main>
  );
}
