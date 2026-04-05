"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSiteAssetValues } from "@/lib/site-assets";

const FEED_ITEMS = [
  { text: "GhostMx completó su perfil en AirNation", keyword: "perfil", time: "hace 1 min" },
  { text: "Equipo Lobo Negro fue creado en Guadalajara", keyword: "Equipo", time: "hace 2 min" },
  { text: "Campo Zona Alfa fue registrado en CDMX", keyword: "Campo", time: "hace 3 min" },
  { text: "ShadowFox registró su primera réplica", keyword: "réplica", time: "hace 4 min" },
  { text: "Delta 5 tiene 8 nuevos integrantes", keyword: "integrantes", time: "hace 6 min" },
  { text: "IronWolf generó su credencial digital", keyword: "credencial", time: "hace 7 min" },
  { text: "Evento nocturno creado en Campo El Bosque", keyword: "Evento", time: "hace 9 min" },
  { text: "Phantom Unit abrió solicitudes de membresía", keyword: "solicitudes", time: "hace 11 min" },
  { text: "ViperX transfirió una réplica a SteelGhost", keyword: "réplica", time: "hace 13 min" },
  { text: "Campo Trinchera registró 3 reseñas nuevas", keyword: "reseñas", time: "hace 15 min" },
  { text: "NightHawk descargó su credencial por primera vez", keyword: "credencial", time: "hace 17 min" },
  { text: "Equipo Spetsnaz MX fue fundado en Monterrey", keyword: "Equipo", time: "hace 19 min" },
  { text: "RavenOps actualizó su perfil de jugador", keyword: "perfil", time: "hace 21 min" },
  { text: "Evento CQB Urbano abrió 20 lugares", keyword: "Evento", time: "hace 23 min" },
  { text: "Campo Desert Storm fue destacado esta semana", keyword: "Campo", time: "hace 25 min" },
  { text: "TigerClaw registró su réplica HK416", keyword: "réplica", time: "hace 28 min" },
  { text: "Equipo Red Fox completó su perfil de equipo", keyword: "equipo", time: "hace 30 min" },
  { text: "SilentBlade se unió a su primer equipo", keyword: "equipo", time: "hace 33 min" },
  { text: "Campo La Fortaleza subió nueva galería", keyword: "Campo", time: "hace 36 min" },
  { text: "WraithMx generó su credencial con QR", keyword: "credencial", time: "hace 38 min" },
  { text: "Equipo Insurgentes aprobó 5 solicitudes", keyword: "solicitudes", time: "hace 41 min" },
  { text: "BullseyeMx registró su réplica número 3", keyword: "réplica", time: "hace 44 min" },
  { text: "Evento Operación Tormenta lleva 34 RSVPs", keyword: "Evento", time: "hace 47 min" },
  { text: "Campo Guerrero abrió agenda para este fin de semana", keyword: "Campo", time: "hace 50 min" },
  { text: "CobraUnit actualizó su perfil con nueva foto", keyword: "perfil", time: "hace 53 min" },
  { text: "StrikerMx reportó una réplica como robada", keyword: "réplica", time: "hace 56 min" },
  { text: "Equipo Alpha Team alcanzó 20 integrantes", keyword: "integrantes", time: "hace 59 min" },
  { text: "PhantomX descargó documentos de Guardia Nacional", keyword: "documentos", time: "hace 62 min" },
  { text: "Campo Bunker Norte recibió su primera reseña", keyword: "reseña", time: "hace 65 min" },
  { text: "FalconMx generó su credencial y la compartió", keyword: "credencial", time: "hace 68 min" },
] as const;

const FEED_INTERVAL_MS = 4000;
const EXIT_DURATION_MS = 450;

const STAT_CONFIG = [
  { key: "stat_jugadores", label: "Jugadores registrados", accent: false as boolean },
  { key: "stat_equipos", label: "Equipos activos", accent: true },
  { key: "stat_campos", label: "Campos registrados", accent: false },
];

function statDisplay(values: Record<string, string>, key: string): string {
  const v = values[key];
  return v?.trim() ? v : "—";
}

function getDotColor(keyword: string): string {
  const k = keyword.toLowerCase();
  if (k === "perfil" || k === "credencial" || k === "evento") return "#CC4B37";
  if (k === "equipo" || k === "integrantes" || k === "solicitudes") return "#1A1A1A";
  if (k === "campo") return "#444444";
  if (k === "réplica" || k === "documentos" || k === "reseña" || k === "reseñas") return "#888888";
  return "#CC4B37";
}

function HighlightedText({ text, keyword }: { text: string; keyword: string }) {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  const idx = lower.indexOf(kw);
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + keyword.length);
  const after = text.slice(idx + keyword.length);
  return (
    <>
      {before}
      <span className="text-an-accent font-bold">{match}</span>
      {after}
    </>
  );
}

type VisibleRow = { id: number; feedIndex: number };

function CommunityActivityFeed() {
  const idRef = useRef(1);
  const [items, setItems] = useState<VisibleRow[]>([{ id: 0, feedIndex: 0 }]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setItems((prev) => {
        if (prev.length === 0) return [{ id: idRef.current++, feedIndex: 0 }];
        const nextFeedIdx = (prev[0].feedIndex + 1) % FEED_ITEMS.length;
        const newItem: VisibleRow = { id: idRef.current++, feedIndex: nextFeedIdx };
        return [newItem, ...prev].slice(0, 6);
      });
    }, FEED_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (items.length < 6) return;
    const t = window.setTimeout(() => {
      setItems((prev) => prev.slice(0, 5));
    }, EXIT_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [items.length]);

  return (
    <>
      <style>{`
        @keyframes community-feed-enter {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes community-feed-exit {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .community-feed-enter {
          animation: community-feed-enter 0.55s ease-out forwards;
        }
        .community-feed-exit {
          animation: community-feed-exit ${EXIT_DURATION_MS}ms ease-out forwards;
        }
      `}</style>
      <div
        className="w-full overflow-hidden border-l-2 border-an-border bg-[#F4F4F4] p-4 sm:p-5 min-h-[280px] min-w-0"
        aria-live="polite"
        aria-label="Actividad reciente en la comunidad"
      >
        <div className="flex flex-col gap-0">
          {items.map((row, i) => {
            const item = FEED_ITEMS[row.feedIndex];
            const isFirst = i === 0;
            const isExiting = items.length === 6 && i === items.length - 1;
            const dot = getDotColor(item.keyword);
            return (
              <div
                key={row.id}
                className={`flex gap-3 border-b border-an-border py-3 first:pt-0 last:border-b-0 last:pb-0 ${
                  isFirst ? "community-feed-enter" : ""
                } ${isExiting ? "community-feed-exit" : ""}`}
              >
                <span className="mt-1.5 shrink-0" aria-hidden>
                  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                    <circle cx="4" cy="4" r="4" fill={dot} />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm leading-snug text-an-text">
                    <HighlightedText text={item.text} keyword={item.keyword} />
                  </p>
                  <p className="mt-1 font-body text-xs text-an-text-dim">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function CommunitySection() {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const vals = await getSiteAssetValues();
      if (cancelled) return;
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

        <CommunityActivityFeed />
      </div>
    </section>
  );
}
