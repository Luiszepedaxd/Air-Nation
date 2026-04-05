"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSiteAssetValues, getSiteAssets } from "@/lib/site-assets";

const COMUNIDAD_KEYS = [
  "comunidad_foto_1",
  "comunidad_foto_2",
  "comunidad_foto_3",
  "comunidad_foto_4",
  "comunidad_foto_5",
  "comunidad_foto_6",
] as const;

const STAT_CONFIG = [
  { key: "stat_jugadores", label: "Jugadores registrados", accent: false as boolean },
  { key: "stat_equipos", label: "Equipos activos", accent: true },
  { key: "stat_campos", label: "Campos registrados", accent: false },
];

function validImageUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

function statDisplay(values: Record<string, string>, key: string): string {
  const v = values[key];
  return v?.trim() ? v : "—";
}

function CommunityGalleryCarousel({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0);
  const n = urls.length;

  const goPrev = useCallback(() => {
    if (n === 0) return;
    setIdx((i) => (i - 1 + n) % n);
  }, [n]);

  const goNext = useCallback(() => {
    if (n === 0) return;
    setIdx((i) => (i + 1) % n);
  }, [n]);

  if (n === 0) {
    return <div className="min-h-[200px] w-full bg-an-surface2 border border-an-border" aria-hidden />;
  }

  const showArrows = n > 1;

  return (
    <div className="relative w-full overflow-hidden border border-an-border bg-an-surface2 aspect-square">
      {urls.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out ${
            i === idx ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
          }`}
        />
      ))}

      {showArrows ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-an-border bg-white/90 text-an-text transition-colors hover:bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-an-border bg-white/90 text-an-text transition-colors hover:bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : null}
    </div>
  );
}

export default function CommunitySection() {
  const [urls, setUrls] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [imgs, vals] = await Promise.all([getSiteAssets(), getSiteAssetValues()]);
      if (cancelled) return;
      const list = COMUNIDAD_KEYS.map((k) => imgs[k]).filter(validImageUrl);
      setUrls(list);
      setValues(vals);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="comunidad" className="bg-[#F4F4F4] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
        <div>
          <div className="mb-5 flex items-center gap-4">
            <span className="block h-[2px] w-7 bg-an-accent" />
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-an-accent">
              Comunidad
            </p>
          </div>
          <h2
            className="font-display font-black uppercase leading-[0.9] text-an-text"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.8rem)" }}
          >
            CONSTRUIDA
            <br />
            POR LOS
            <br />
            QUE JUEGAN.
          </h2>
          <p className="mt-6 max-w-lg font-body text-base leading-[1.7] text-an-text-dim sm:text-[1.05rem]">
            Cada perfil, equipo y campo registrado suma a la plataforma que todos queríamos. AirNation nació del airsoft
            mexicano — y sigue creciendo desde adentro.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-px bg-an-border">
            {STAT_CONFIG.map(({ key, label, accent }) => (
              <div
                key={key}
                className={`flex flex-col items-center text-center py-5 px-3 ${
                  accent ? "bg-an-accent" : "bg-an-surface2"
                }`}
              >
                <span
                  className={`font-display font-black text-xl sm:text-2xl uppercase leading-none ${
                    accent ? "text-white" : "text-an-text"
                  }`}
                >
                  {statDisplay(values, key)}
                </span>
                <span
                  className={`font-body text-[0.58rem] sm:text-[0.62rem] uppercase tracking-[0.1em] mt-1.5 leading-snug ${
                    accent ? "text-white/80" : "text-an-text-dim"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-[1.1rem] bg-an-accent text-white font-body font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:bg-an-accent-h transition-colors rounded-[2px]"
            >
              Unirme a la comunidad
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        <CommunityGalleryCarousel urls={urls} />
      </div>
    </section>
  );
}
