"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSiteAssets, getSiteAssetValues } from "@/lib/site-assets";

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

/** Credencial siempre activa; resto inactivo — mismo orden que BottomNav móvil. */
function MockBottomNav() {
  const credColor = "#CC4B37";

  return (
    <nav
      className="grid h-11 w-full shrink-0 grid-cols-6 items-stretch border-t border-solid border-[#EEEEEE] bg-white"
      aria-hidden
    >
      <div className="flex min-w-0 flex-col items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
            stroke={INACTIVE}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden text-[7px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]" style={{ fontFamily: "'Jost', sans-serif" }}>
          HOME
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="8" r="4" stroke={INACTIVE} strokeWidth="1.8" />
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={INACTIVE} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="hidden text-[7px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]" style={{ fontFamily: "'Jost', sans-serif" }}>
          PERFIL
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <rect x="2" y="6" width="20" height="13" rx="1.5" stroke={credColor} strokeWidth="1.8" />
          <circle cx="8" cy="12" r="2.5" stroke={credColor} strokeWidth="1.8" />
          <path d="M13 10h5M13 13.5h3.5" stroke={credColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="hidden text-[7px] font-bold uppercase tracking-wider leading-none text-[#CC4B37]" style={{ fontFamily: "'Jost', sans-serif" }}>
          CREDENCIAL
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
            stroke={INACTIVE}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11" r="2.25" fill="none" stroke={INACTIVE} strokeWidth="1.5" />
        </svg>
        <span className="hidden text-[7px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]" style={{ fontFamily: "'Jost', sans-serif" }}>
          CAMPOS
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="M4 12h16M4 12c0-1 .5-2 1.5-2.5L14 5M4 12c0 1 .5 2 1.5 2.5L14 19M20 12l-3-4M20 12l-3 4"
            stroke={INACTIVE}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="hidden text-[7px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]" style={{ fontFamily: "'Jost', sans-serif" }}>
          RÉPLICAS
        </span>
      </div>

      <div className="relative flex min-w-0 flex-col items-center justify-center">
        <span className="absolute right-1.5 top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-[#CC4B37]" aria-hidden />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="#CCCCCC" strokeWidth="1.8" />
          <path d="M12 8v4M12 16h.01" stroke="#CCCCCC" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="hidden text-[7px] font-bold uppercase tracking-wider leading-none text-[#CCCCCC]" style={{ fontFamily: "'Jost', sans-serif" }}>
          SOS
        </span>
      </div>
    </nav>
  );
}

function CredentialPhone({ data }: { data: CredentialPreviewData }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="flex h-14 shrink-0 flex-col items-center justify-center bg-[#CC4B37] px-5 text-center">
        <p className="font-display text-xs font-black uppercase leading-tight text-white">AIRNATION</p>
        <p className="mt-0.5 font-body text-[9px] uppercase tracking-widest text-white/80">CREDENCIAL DE JUGADOR</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-evenly overflow-hidden px-5 py-2">
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-full bg-[#E0E0E0]" aria-hidden />
        )}
        <p className="font-display text-base font-black uppercase leading-tight text-[#111111]">{data.alias}</p>
        <p className="font-body text-[10px] leading-tight text-[#444444]">{data.rol}</p>
        <p className="font-body text-[10px] font-bold leading-tight text-[#111111]">{data.equipo}</p>
        <p className="font-body text-[10px] leading-tight text-[#444444]">{data.ciudad}</p>
        <div className="my-0.5 w-full shrink-0 border-t border-[#EEEEEE]" />
        <p className="font-display text-[8px] font-normal uppercase tracking-widest text-[#AAAAAA]">Nº MIEMBRO</p>
        <p className="font-display text-base font-black leading-none text-[#CC4B37]">{data.numero}</p>
        <svg className="shrink-0 border border-[#EEEEEE]" width="60" height="60" viewBox="0 0 48 48" aria-hidden>
          {QR_PATTERN.map((row, ri) =>
            row.map((bit, ci) => (
              <rect key={`${ri}-${ci}`} x={ci * 8} y={ri * 8} width={8} height={8} fill={bit ? "#111111" : "#FFFFFF"} />
            )),
          )}
        </svg>
        <p className="font-display text-[8px] uppercase tracking-widest text-[#AAAAAA]">DESDE ABR 2026</p>
      </div>

      <div
        className="flex h-9 w-full shrink-0 items-center justify-center bg-[#111111] font-body text-[9px] font-bold uppercase tracking-widest text-white"
        style={{ borderRadius: 2 }}
      >
        AGREGAR A WALLET
      </div>

      <MockBottomNav />
    </div>
  );
}

function AppPhoneMockup({ credentialData }: { credentialData: CredentialPreviewData }) {
  return (
    <div className="flex w-full flex-col items-center">
      <div
        className="box-border flex w-[260px] flex-col rounded-[2.5rem] bg-[#111111] p-3"
        style={{
          minHeight: 520,
          maxHeight: 580,
          height: 560,
          boxShadow: "0 0 0 2px #333333, 0 30px 80px rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] bg-white">
          <div className="flex h-6 shrink-0 items-center justify-center bg-[#111111]">
            <div className="h-3 w-3 rounded-full bg-[#333333]" aria-hidden />
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CredentialPhone data={credentialData} />
          </div>
        </div>
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
