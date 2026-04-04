"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
).replace(/\/$/, "");

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

export default function NuevoEquipoPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = useCallback(async () => {
    const n = nombre.trim();
    const c = ciudad.trim();
    if (!userId || n.length < 2 || c.length < 2) {
      setError("Nombre y ciudad (mínimo 2 caracteres) son obligatorios.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: n,
          ciudad: c,
          created_by: userId,
        }),
      });
      const data = (await res.json()) as {
        team?: { id: string; nombre?: string; slug?: string | null };
        error?: string;
      };
      if (!res.ok || !data.team?.id) {
        setError(data.error || "No se pudo crear el equipo. Intenta de nuevo.");
        return;
      }
      const slug = data.team.slug?.trim();
      if (slug) {
        router.push(`/equipos/${encodeURIComponent(slug)}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("No se pudo crear el equipo. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }, [userId, nombre, ciudad, router]);

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
      <div className="mx-auto max-w-[480px]">
        <h1
          className="text-[22px] font-extrabold leading-tight text-[#111111] md:text-[26px]"
          style={jostHeading}
        >
          Nuevo equipo
        </h1>
        <p className="mt-2 text-sm text-[#666666]">
          Completa los datos para registrar tu equipo.
        </p>

        <div className="mt-8 flex flex-col gap-5">
          <div>
            <label
              className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
              style={jostHeading}
            >
              Nombre del equipo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Ghost Squad"
              maxLength={120}
              className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
              style={jostHeading}
            >
              Ciudad
            </label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej. Guadalajara"
              maxLength={80}
              className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-[#CC4B37]">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || nombre.trim().length < 2 || ciudad.trim().length < 2}
          className="mt-8 w-full rounded-[2px] bg-[#CC4B37] py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
          style={jostHeading}
        >
          {submitting ? "Creando…" : "Crear equipo"}
        </button>

        <p className="mt-6 text-center text-sm text-[#666666]">
          <Link href="/dashboard" className="text-[#CC4B37] hover:underline">
            Volver al panel
          </Link>
        </p>
      </div>
    </main>
  );
}
