"use client";

import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateTeamSlug } from "@/lib/team-slug";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
).replace(/\/$/, "");

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

export function TeamForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const slug = useMemo(
    () => generateTeamSlug(undefined, nombre),
    [nombre]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const n = nombre.trim();
      const c = ciudad.trim();
      if (!userId || n.length < 2 || c.length < 2) {
        setError("Nombre y ciudad (mínimo 2 caracteres) son obligatorios.");
        return;
      }
      const slugToSend = generateTeamSlug(undefined, n);
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
            slug: slugToSend,
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
        const outSlug = data.team.slug?.trim();
        if (outSlug) {
          router.push(`/equipos/${encodeURIComponent(outSlug)}`);
        } else {
          router.push("/dashboard");
        }
      } catch {
        setError("No se pudo crear el equipo. Intenta de nuevo.");
      } finally {
        setSubmitting(false);
      }
    },
    [userId, nombre, ciudad, router]
  );

  return (
    <form
      className="mx-auto max-w-[480px]"
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
    >
      <input type="hidden" name="slug" value={slug} readOnly aria-hidden />

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
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Ghost Squad"
            maxLength={120}
            autoComplete="organization"
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
            name="ciudad"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ej. Guadalajara"
            maxLength={80}
            autoComplete="address-level2"
            className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[#CC4B37]">{error}</p>
      ) : null}

      <button
        type="submit"
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
    </form>
  );
}
