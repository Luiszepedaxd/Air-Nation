"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { generateTeamSlug } from "@/lib/team-slug";
import {
  createTeamAction,
  type CreateTeamState,
} from "./actions";

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

const initialState: CreateTeamState = null;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="mt-8 w-full rounded-[2px] bg-[#CC4B37] py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
      style={jostHeading}
    >
      {pending ? "Creando…" : "Crear equipo"}
    </button>
  );
}

export function TeamForm() {
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [state, formAction] = useFormState(createTeamAction, initialState);

  const slug = useMemo(
    () => generateTeamSlug(undefined, nombre),
    [nombre]
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const n = nombre.trim();
    const c = ciudad.trim();
    if (n.length < 2 || c.length < 2) {
      e.preventDefault();
    }
  };

  return (
    <form
      className="mx-auto max-w-[480px]"
      action={formAction}
      onSubmit={handleSubmit}
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

      {state?.error ? (
        <p className="mt-4 text-sm text-[#CC4B37]">{state.error}</p>
      ) : null}

      <SubmitButton
        disabled={nombre.trim().length < 2 || ciudad.trim().length < 2}
      />

      <p className="mt-6 text-center text-sm text-[#666666]">
        <Link href="/dashboard" className="text-[#CC4B37] hover:underline">
          Volver al panel
        </Link>
      </p>
    </form>
  );
}
