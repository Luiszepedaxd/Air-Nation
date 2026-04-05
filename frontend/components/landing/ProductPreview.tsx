"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSiteAssets, getSiteAssetValues } from "@/lib/site-assets";

const SCREEN_MS = 4000;
const PAUSE_RESUME_MS = 6000;
const TRANSITION_MS = 400;

const QR_PATTERN: number[][] = [
  [1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0],
  [1, 1, 0, 0, 1, 1],
  [0, 1, 1, 1, 0, 1],
  [1, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1],
];

const FALLBACK = {
  alias: "GHOSTMX",
  rol: "LÍDER DE EQUIPO",
  equipo: "575 AIRSOFT",
  ciudad: "Guadalajara",
  numero: "#001015",
} as const;

function validImageUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

function pickText(values: Record<string, string>, key: string, fallback: string): string {
  const v = values[key];
  return v?.trim() ? v : fallback;
}

type CredentialPreviewData = {
  alias: string;
  rol: string;
  equipo: string;
  ciudad: string;
  numero: string;
  avatarUrl: string | null;
};

function IconHome({ active }: { active: boolean }) {
  const c = active ? "#CC4B37" : "#AAAAAA";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={c}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFeed({ active }: { active: boolean }) {
  const c = active ? "#CC4B37" : "#AAAAAA";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h10" stroke={c} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconCredencialHex({ active }: { active: boolean }) {
  const c = active ? "#CC4B37" : "#AAAAAA";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7.5 4.33v8.66L12 20l-7.5-4.33V7.33L12 3z"
        stroke={c}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCampos({ active }: { active: boolean }) {
  const c = active ? "#CC4B37" : "#AAAAAA";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
        stroke={c}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.25" fill={c} />
    </svg>
  );
}

function IconPerfil({ active }: { active: boolean }) {
  const c = active ? "#CC4B37" : "#AAAAAA";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.5" stroke={c} strokeWidth="1.75" />
      <path
        d="M6 20.5c0-3.5 2.69-5.5 6-5.5s6 2 6 5.5"
        stroke={c}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CredentialScreen({ data }: { data: CredentialPreviewData }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="bg-[#CC4B37] px-4 py-3 text-center">
        <p className="font-display text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-white">AIRNATION</p>
        <p className="font-display mt-1 text-[0.55rem] font-black uppercase tracking-[0.14em] text-white/95">
          CREDENCIAL DE JUGADOR
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-4 py-4">
        {data.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-full bg-[#E0E0E0]" aria-hidden />
        )}
        <p className="font-display text-lg font-black uppercase tracking-wide text-an-text">{data.alias}</p>
        <div className="w-full space-y-1.5 text-center font-body text-xs text-an-text-dim">
          <p>
            <span className="text-an-text-dim">Rol: </span>
            <span className="font-bold uppercase text-an-text">{data.rol}</span>
          </p>
          <p>
            <span className="text-an-text-dim">Equipo: </span>
            <span className="font-bold text-an-text">{data.equipo}</span>
          </p>
          <p>
            <span className="text-an-text-dim">Ciudad: </span>
            <span className="font-bold text-an-text">{data.ciudad}</span>
          </p>
          <p>
            <span className="text-an-text-dim">Número de miembro: </span>
            <span className="font-bold text-an-text">{data.numero}</span>
          </p>
        </div>
        <svg
          className="mt-1 shrink-0 border border-[#EEEEEE] p-1"
          width="132"
          height="132"
          viewBox="0 0 36 36"
          aria-hidden
        >
          {QR_PATTERN.map((row, ri) =>
            row.map((bit, ci) => (
              <rect
                key={`${ri}-${ci}`}
                x={ci * 6}
                y={ri * 6}
                width={6}
                height={6}
                fill={bit ? "#1A1A1A" : "#FFFFFF"}
              />
            )),
          )}
        </svg>
        <div className="mt-auto w-full pt-2">
          <div
            className="flex h-10 w-full max-w-full items-center justify-center bg-[#1A1A1A] font-display text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white"
            style={{ borderRadius: 2 }}
          >
            AGREGAR A WALLET
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-[#EEEEEE] px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-[#EEEEEE]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-body text-base font-bold text-an-text">José Guzmán</p>
            <p className="font-body text-sm text-an-text-dim">@ghostmx</p>
            <span className="mt-2 inline-block bg-[#CC4B37] px-2 py-0.5 font-display text-[0.6rem] font-bold uppercase tracking-wider text-white">
              Nº 1015
            </span>
          </div>
        </div>
      </div>
      <div className="border-b border-[#EEEEEE] px-4 py-3 text-center font-body text-xs text-an-text">
        <span className="text-an-text-dim">Equipos: </span>
        <span className="font-bold">2</span>
        <span className="mx-2 text-[#EEEEEE]">|</span>
        <span className="text-an-text-dim">Campos: </span>
        <span className="font-bold">5</span>
        <span className="mx-2 text-[#EEEEEE]">|</span>
        <span className="text-an-text-dim">Réplicas: </span>
        <span className="font-bold">3</span>
      </div>
      <div className="border-b border-[#EEEEEE] px-4 py-3">
        <p className="font-display text-[0.6rem] font-black uppercase tracking-[0.15em] text-an-text-dim">MI EQUIPO</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-body text-sm font-bold text-an-text">575 AIRSOFT</span>
          <span className="border border-[#EEEEEE] bg-[#F4F4F4] px-2 py-0.5 font-display text-[0.55rem] font-bold uppercase text-an-text">
            LÍDER
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="font-display text-[0.6rem] font-black uppercase tracking-[0.15em] text-an-text-dim">
          ÚLTIMAS RÉPLICAS
        </p>
        <div className="mt-2 space-y-2 border-t border-[#EEEEEE] pt-2">
          <p className="border-b border-[#EEEEEE] pb-2 font-body text-xs text-an-text">HK416 · G&G</p>
          <p className="font-body text-xs text-an-text">M4 CQB · Tokyo Marui</p>
        </div>
      </div>
    </div>
  );
}

function MockNavBar({ screen }: { screen: number }) {
  const credActive = screen === 0;
  const perfilActive = screen === 1;
  return (
    <nav
      className="flex h-[52px] shrink-0 items-center justify-around border-t border-[#EEEEEE] bg-white px-1"
      aria-hidden
    >
      <div className="flex flex-1 justify-center">
        <IconHome active={false} />
      </div>
      <div className="flex flex-1 justify-center">
        <IconFeed active={false} />
      </div>
      <div className="flex flex-1 justify-center">
        <IconCredencialHex active={credActive} />
      </div>
      <div className="flex flex-1 justify-center">
        <IconCampos active={false} />
      </div>
      <div className="flex flex-1 justify-center">
        <IconPerfil active={perfilActive} />
      </div>
    </nav>
  );
}

function AppPhoneMockup({ credentialData }: { credentialData: CredentialPreviewData }) {
  const [screen, setScreen] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);

  const startAuto = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    intervalRef.current = window.setInterval(() => {
      setScreen((s) => (s + 1) % 2);
    }, SCREEN_MS);
  }, []);

  useEffect(() => {
    startAuto();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [startAuto]);

  const onIndicatorClick = (index: number) => {
    setScreen(index);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    resumeTimeoutRef.current = window.setTimeout(() => {
      resumeTimeoutRef.current = null;
      startAuto();
    }, PAUSE_RESUME_MS);
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="flex w-full max-w-[300px] flex-col rounded-[2.5rem] bg-[#1A1A1A] p-[10px] sm:min-h-[580px]"
        style={{
          boxShadow:
            "0 2px 4px rgba(0,0,0,0.12), 0 12px 28px rgba(0,0,0,0.18), 0 24px 56px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] bg-white">
          <div className="flex h-7 shrink-0 items-center justify-center bg-black">
            <div className="h-2.5 w-2.5 rounded-full bg-[#333]" aria-hidden />
          </div>
          <div className="relative min-h-0 flex-1">
            <div
              className={`absolute inset-0 transition-opacity ease-out ${
                screen === 0 ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
              }`}
              style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            >
              <CredentialScreen data={credentialData} />
            </div>
            <div
              className={`absolute inset-0 transition-opacity ease-out ${
                screen === 1 ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
              }`}
              style={{ transitionDuration: `${TRANSITION_MS}ms` }}
            >
              <ProfileScreen />
            </div>
          </div>
          <MockNavBar screen={screen} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3" role="tablist" aria-label="Pantalla del mockup">
        <button
          type="button"
          onClick={() => onIndicatorClick(0)}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${screen === 0 ? "bg-[#CC4B37]" : "bg-[#EEEEEE]"}`}
          aria-label="Ver credencial"
          aria-current={screen === 0 ? "true" : undefined}
        />
        <button
          type="button"
          onClick={() => onIndicatorClick(1)}
          className={`h-2.5 w-2.5 rounded-full transition-colors ${screen === 1 ? "bg-[#CC4B37]" : "bg-[#EEEEEE]"}`}
          aria-label="Ver perfil"
          aria-current={screen === 1 ? "true" : undefined}
        />
      </div>
    </div>
  );
}

export default function ProductPreview() {
  const [credentialData, setCredentialData] = useState<CredentialPreviewData>({
    alias: FALLBACK.alias,
    rol: FALLBACK.rol,
    equipo: FALLBACK.equipo,
    ciudad: FALLBACK.ciudad,
    numero: FALLBACK.numero,
    avatarUrl: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [imgs, vals] = await Promise.all([getSiteAssets(), getSiteAssetValues()]);
      if (cancelled) return;
      const avatarRaw = imgs["credencial_avatar"];
      setCredentialData({
        alias: pickText(vals, "credencial_alias", FALLBACK.alias),
        rol: pickText(vals, "credencial_rol", FALLBACK.rol),
        equipo: pickText(vals, "credencial_equipo", FALLBACK.equipo),
        ciudad: pickText(vals, "credencial_ciudad", FALLBACK.ciudad),
        numero: pickText(vals, "credencial_numero", FALLBACK.numero),
        avatarUrl: validImageUrl(avatarRaw) ? avatarRaw.trim() : null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

        <AppPhoneMockup credentialData={credentialData} />
      </div>
    </section>
  );
}
