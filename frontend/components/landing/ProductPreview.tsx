"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SCREEN_MS = 4000;

const QR_PATTERN: number[][] = [
  [1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [0, 1, 1, 1, 0, 1],
  [1, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1],
];

function CredentialScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="bg-[#CC4B37] px-4 py-3 text-center">
        <p className="font-display text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white">AIRNATION</p>
        <p className="font-display mt-1 text-[0.55rem] font-black uppercase tracking-[0.14em] text-white/95">
          CREDENCIAL DE JUGADOR
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center gap-3 px-4 py-5">
        <div className="h-16 w-16 shrink-0 rounded-full bg-[#EEEEEE] border border-an-border" aria-hidden />
        <p className="font-display text-lg font-black uppercase tracking-wide text-an-text">GHOSTMX</p>
        <div className="w-full space-y-1.5 text-center font-body text-xs text-an-text-dim">
          <p>
            <span className="text-an-text-dim">Rol: </span>
            <span className="font-bold uppercase text-an-text">LÍDER DE EQUIPO</span>
          </p>
          <p>
            <span className="text-an-text-dim">Equipo: </span>
            <span className="font-bold text-an-text">575 AIRSOFT</span>
          </p>
          <p>
            <span className="text-an-text-dim">Ciudad: </span>
            <span className="font-bold text-an-text">Guadalajara</span>
          </p>
          <p>
            <span className="text-an-text-dim">Número de miembro: </span>
            <span className="font-bold text-an-text">#001015</span>
          </p>
          <p className="font-display text-[0.65rem] font-bold uppercase tracking-wider text-an-text">
            DESDE ABR 2026
          </p>
        </div>
        <div
          className="mt-1 grid w-[132px] grid-cols-6 gap-px border border-an-border bg-an-border p-1"
          aria-hidden
        >
          {QR_PATTERN.map((row, ri) =>
            row.map((bit, ci) => (
              <div
                key={`${ri}-${ci}`}
                className="aspect-square w-full"
                style={{ backgroundColor: bit ? "#1A1A1A" : "#FFFFFF" }}
              />
            )),
          )}
        </div>
        <div className="mt-auto w-full pt-2">
          <div className="flex h-10 w-full items-center justify-center bg-[#1A1A1A] font-display text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white">
            DESCARGAR PNG
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-an-border px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-[#EEEEEE] border border-an-border" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-body text-base font-bold text-an-text">José Guzmán</p>
            <p className="font-body text-sm text-an-text-dim">@ghostmx</p>
            <span className="mt-2 inline-block bg-[#CC4B37] px-2 py-0.5 font-display text-[0.6rem] font-bold uppercase tracking-wider text-white">
              Nº 1015
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-an-border px-4 py-3 font-body text-xs text-an-text">
        <span className="text-an-text-dim">[</span>
        <span>
          <span className="text-an-text-dim">Equipos: </span>
          <span className="font-bold">2</span>
        </span>
        <span className="text-an-text-dim">]</span>
        <span className="text-an-text-dim">[</span>
        <span>
          <span className="text-an-text-dim">Campos: </span>
          <span className="font-bold">5</span>
        </span>
        <span className="text-an-text-dim">]</span>
        <span className="text-an-text-dim">[</span>
        <span>
          <span className="text-an-text-dim">Réplicas: </span>
          <span className="font-bold">3</span>
        </span>
        <span className="text-an-text-dim">]</span>
      </div>
      <div className="border-b border-an-border px-4 py-3">
        <p className="font-display text-[0.6rem] font-black uppercase tracking-[0.15em] text-an-text-dim">MI EQUIPO</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-body text-sm font-bold text-an-text">575 AIRSOFT</span>
          <span className="border border-an-border bg-an-surface px-2 py-0.5 font-display text-[0.55rem] font-bold uppercase text-an-text">
            LÍDER
          </span>
        </div>
      </div>
      <div className="flex-1 px-4 py-3">
        <p className="font-display text-[0.6rem] font-black uppercase tracking-[0.15em] text-an-text-dim">
          ÚLTIMAS RÉPLICAS
        </p>
        <div className="mt-2 space-y-2 border-t border-an-border pt-2">
          <p className="border-b border-an-border pb-2 font-body text-xs text-an-text">HK416 · G&G</p>
          <p className="font-body text-xs text-an-text">M4 CQB · Tokyo Marui</p>
        </div>
      </div>
    </div>
  );
}

function AppPhoneMockup() {
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setScreen((s) => (s + 1) % 2);
    }, SCREEN_MS);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative aspect-[9/16] w-full max-w-[280px] overflow-hidden border-2 border-[#1A1A1A] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-[2rem]">
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-out ${
            screen === 0 ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
          }`}
        >
          <CredentialScreen />
        </div>
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-out ${
            screen === 1 ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
          }`}
        >
          <ProfileScreen />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Pantalla del mockup">
        <span
          className={`h-2 w-2 rounded-full ${screen === 0 ? "bg-[#CC4B37]" : "bg-[#EEEEEE]"}`}
          aria-current={screen === 0 ? "true" : undefined}
        />
        <span
          className={`h-2 w-2 rounded-full ${screen === 1 ? "bg-[#CC4B37]" : "bg-[#EEEEEE]"}`}
          aria-current={screen === 1 ? "true" : undefined}
        />
      </div>
    </div>
  );
}

export default function ProductPreview() {
  return (
    <section id="preview" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
        <div>
          <div className="mb-5 flex items-center gap-4">
            <span className="block h-[2px] w-7 bg-an-accent" />
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-an-accent">
              Vista previa
            </p>
          </div>
          <h2
            className="font-display font-black uppercase leading-[0.9] text-an-text"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
          >
            ASÍ SE VE
            <br />
            LA PLATAFORMA.
          </h2>
          <p className="mt-6 max-w-lg font-body text-base leading-[1.7] text-an-text-dim sm:text-[1.05rem]">
            Perfil, credencial, equipos, campos y eventos — todo en una sola app.
          </p>
          <Link
            href="/register"
            className="font-body mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-an-accent hover:text-an-accent-h transition-colors"
          >
            Crear mi perfil
            <span aria-hidden>→</span>
          </Link>
        </div>

        <AppPhoneMockup />
      </div>
    </section>
  );
}
