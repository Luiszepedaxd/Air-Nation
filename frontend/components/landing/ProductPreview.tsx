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

const INACTIVE = "#CCCCCC";

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

/** Íconos y orden alineados con BottomNav.tsx (NAV_ITEMS_MOBILE, rol player). */
function MockBottomNav({ screen }: { screen: number }) {
  const credActive = screen === 0;
  const perfilActive = screen === 1;

  const homeColor = INACTIVE;
  const perfilColor = perfilActive ? "#CC4B37" : INACTIVE;
  const credColor = credActive ? "#CC4B37" : INACTIVE;
  const camposColor = INACTIVE;
  const replicasColor = INACTIVE;

  return (
    <nav
      className="grid h-[52px] w-full shrink-0 grid-cols-6 items-stretch border-t border-solid border-[#EEEEEE] bg-white"
      aria-hidden
    >
      <div className="flex min-w-0 flex-col items-center justify-center gap-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
            stroke={homeColor}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="text-[8px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          HOME
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center gap-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <circle cx="12" cy="8" r="4" stroke={perfilColor} strokeWidth="1.8" />
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={perfilColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span
          className={`text-[8px] font-bold uppercase tracking-wider leading-none ${
            perfilActive ? "text-[#CC4B37]" : "text-[#CCCCCC]"
          }`}
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          PERFIL
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center gap-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <rect x="2" y="6" width="20" height="13" rx="1.5" stroke={credColor} strokeWidth="1.8" />
          <circle cx="8" cy="12" r="2.5" stroke={credColor} strokeWidth="1.8" />
          <path d="M13 10h5M13 13.5h3.5" stroke={credColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span
          className={`text-[8px] font-bold uppercase tracking-wider leading-none ${
            credActive ? "text-[#CC4B37]" : "text-[#CCCCCC]"
          }`}
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          CREDENCIAL
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center gap-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
            stroke={camposColor}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="11"
            r="2.25"
            fill="none"
            stroke={camposColor}
            strokeWidth="1.5"
          />
        </svg>
        <span
          className="text-[8px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          CAMPOS
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center gap-1">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M4 12h16M4 12c0-1 .5-2 1.5-2.5L14 5M4 12c0 1 .5 2 1.5 2.5L14 19M20 12l-3-4M20 12l-3 4"
            stroke={replicasColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="text-[8px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          RÉPLICAS
        </span>
      </div>

      <div className="relative flex min-w-0 flex-col items-center justify-center gap-1">
        <span className="absolute right-2 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-[#CC4B37]" aria-hidden />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="#CCCCCC" strokeWidth="1.8" />
          <path d="M12 8v4M12 16h.01" stroke="#CCCCCC" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span
          className="text-[8px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          SOS
        </span>
      </div>
    </nav>
  );
}

function CredentialScreen({ data }: { data: CredentialPreviewData }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-16 shrink-0 flex-col items-center justify-center bg-[#CC4B37] px-5 text-center">
        <p className="font-display text-sm font-black uppercase text-white">AIRNATION</p>
        <p className="mt-0.5 font-body text-[10px] uppercase tracking-widest text-white/80">
          CREDENCIAL DE JUGADOR
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-0 pt-4">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto">
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full bg-[#E0E0E0]" aria-hidden />
          )}
          <p className="font-display mt-3 text-xl font-black uppercase text-[#111111]">{data.alias}</p>
          <p className="mt-1 font-body text-xs text-[#444444]">{data.rol}</p>
          <p className="mt-1 font-body text-xs font-bold text-[#111111]">{data.equipo}</p>
          <p className="mt-1 font-body text-xs text-[#444444]">{data.ciudad}</p>
          <div className="my-3 w-full border-t border-[#EEEEEE]" />
          <p className="font-display text-[9px] font-normal uppercase tracking-widest text-[#AAAAAA]">Nº MIEMBRO</p>
          <p className="font-display text-lg font-black text-[#CC4B37]">{data.numero}</p>
          <svg
            className="mt-3 shrink-0 border border-[#EEEEEE]"
            width="80"
            height="80"
            viewBox="0 0 48 48"
            aria-hidden
          >
            {QR_PATTERN.map((row, ri) =>
              row.map((bit, ci) => (
                <rect
                  key={`${ri}-${ci}`}
                  x={ci * 8}
                  y={ri * 8}
                  width={8}
                  height={8}
                  fill={bit ? "#111111" : "#FFFFFF"}
                />
              )),
            )}
          </svg>
          <p className="mt-3 font-display text-[9px] uppercase tracking-widest text-[#AAAAAA]">DESDE ABR 2026</p>
        </div>
        <div className="mt-auto shrink-0 pt-3">
          <div
            className="flex w-full items-center justify-center bg-[#111111] py-2.5 font-body text-[10px] font-bold uppercase tracking-widest text-white"
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
      <div className="border-b border-[#EEEEEE] p-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#E0E0E0]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-[#111111]">José Guzmán</p>
            <p className="font-body text-xs text-[#AAAAAA]">@ghostmx</p>
            <span className="mt-2 inline-block bg-[#CC4B37] px-2 py-0.5 font-body text-[10px] font-bold text-white">
              Nº 1015
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 border-b border-[#EEEEEE]">
        <div className="flex flex-col items-center justify-center border-r border-[#EEEEEE] py-3 text-center">
          <span className="font-display text-lg font-black text-[#111111]">2</span>
          <span className="font-body text-[9px] text-[#AAAAAA]">Equipos</span>
        </div>
        <div className="flex flex-col items-center justify-center border-r border-[#EEEEEE] py-3 text-center">
          <span className="font-display text-lg font-black text-[#111111]">5</span>
          <span className="font-body text-[9px] text-[#AAAAAA]">Campos</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 text-center">
          <span className="font-display text-lg font-black text-[#111111]">3</span>
          <span className="font-body text-[9px] text-[#AAAAAA]">Réplicas</span>
        </div>
      </div>
      <div className="border-b border-[#EEEEEE] p-3">
        <p className="font-body text-[9px] uppercase tracking-wide text-[#AAAAAA]">MI EQUIPO</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="font-display text-sm font-bold text-[#111111]">575 AIRSOFT</span>
          <span className="bg-[#111111] px-2 py-0.5 font-body text-[9px] font-bold uppercase text-white">LÍDER</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="font-body text-[9px] uppercase tracking-wide text-[#AAAAAA]">ÚLTIMAS RÉPLICAS</p>
        <p className="mt-2 border-b border-[#EEEEEE] pb-2 font-body text-xs text-[#444444]">HK416 · G&G</p>
        <p className="mt-2 font-body text-xs text-[#444444]">M4 CQB · Tokyo Marui</p>
      </div>
    </div>
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
        className="box-border flex h-[560px] w-[280px] flex-col rounded-[2.5rem] bg-[#111111] p-3"
        style={{
          boxShadow: "0 0 0 2px #333333, 0 30px 80px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] bg-white">
          <div className="flex h-6 shrink-0 items-center justify-center bg-[#111111]">
            <div className="h-3 w-3 rounded-full bg-[#333333]" aria-hidden />
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
          <MockBottomNav screen={screen} />
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
