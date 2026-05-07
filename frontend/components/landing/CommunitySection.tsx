"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const FEED_INTERVAL_MS = 3500;
const EXIT_DURATION_MS = 600;

const FEED_ITEMS = [
  { text: "Un equipo registró 8 nuevos integrantes", keyword: "equipo", time: "hace minutos" },
  { text: "Se registró una nueva réplica en Arsenal", keyword: "réplica", time: "hace minutos" },
  { text: "Un nuevo campo fue registrado en CDMX", keyword: "campo", time: "hace minutos" },
  { text: "Equipo creado en Guadalajara", keyword: "equipo", time: "hace minutos" },
  { text: "Un jugador completó su perfil en AirNation", keyword: "perfil", time: "hace minutos" },
  { text: "Nuevo evento publicado en el calendario", keyword: "evento", time: "hace minutos" },
  { text: "Solicitud aceptada en un equipo", keyword: "solicitudes", time: "hace minutos" },
  { text: "Se generó una credencial digital nueva", keyword: "credencial", time: "hace minutos" },
  { text: "Un equipo confirmó asistencia a un evento", keyword: "evento", time: "hace minutos" },
  { text: "Se cargó un parche oficial al perfil de equipo", keyword: "equipo", time: "hace minutos" },
  { text: "Un campo recibió una nueva reseña", keyword: "reseña", time: "hace minutos" },
  { text: "Se subieron documentos a una réplica", keyword: "documentos", time: "hace minutos" },
];

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
      <span className="font-bold text-[#CC4B37]">{match}</span>
      {after}
    </>
  );
}

type VisibleRow = { id: number; feedIndex: number };

function CommunityActivityFeed() {
  const idRef = useRef(1);
  const [items, setItems] = useState<VisibleRow[]>([{ id: 0, feedIndex: 0 }]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const t = window.setInterval(() => {
      setItems((prev) => {
        if (prev.length === 0) return [{ id: idRef.current++, feedIndex: 0 }];
        const nextFeedIdx = (prev[0].feedIndex + 1) % FEED_ITEMS.length;
        const newItem: VisibleRow = { id: idRef.current++, feedIndex: nextFeedIdx };
        return [newItem, ...prev].slice(0, 6);
      });
    }, FEED_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [reducedMotion]);

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
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes community-feed-exit {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .community-feed-enter {
          animation: community-feed-enter 0.55s ease-out forwards;
        }
        .community-feed-exit {
          animation: community-feed-exit ${EXIT_DURATION_MS}ms ease-out forwards;
        }
      `}</style>
      <div
        className="relative w-full overflow-hidden border border-solid border-[#EEEEEE] bg-white p-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] sm:p-6"
        aria-live="polite"
        aria-label="Actividad reciente en la comunidad"
        style={{ minHeight: 320 }}
      >
        {/* Pulso indicador "EN VIVO" */}
        <div className="mb-4 flex items-center gap-2 border-b border-solid border-[#EEEEEE] pb-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#CC4B37] opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#CC4B37]"></span>
          </span>
          <span className="font-body text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-[#666666]">
            Actividad en vivo
          </span>
        </div>

        <div className="flex flex-col gap-0">
          {items.map((row, i) => {
            const item = FEED_ITEMS[row.feedIndex];
            const isFirst = i === 0;
            const isExiting = items.length === 6 && i === items.length - 1;
            const dot = getDotColor(item.keyword);
            return (
              <div
                key={row.id}
                className={`flex gap-3 border-b border-[#EEEEEE] py-3 first:pt-0 last:border-b-0 last:pb-0 ${
                  isFirst ? "community-feed-enter" : ""
                } ${isExiting ? "community-feed-exit" : ""}`}
              >
                <span className="mt-1.5 shrink-0" aria-hidden>
                  <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
                    <circle cx="4" cy="4" r="4" fill={dot} />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[0.875rem] leading-snug text-[#111111]">
                    <HighlightedText text={item.text} keyword={item.keyword} />
                  </p>
                  <p className="mt-1 font-body text-[0.7rem] text-[#999999]">{item.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function RevealWrapper({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function CommunitySection() {
  return (
    <section
      id="comunidad"
      className="relative bg-[#F4F4F4] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Columna izquierda: texto editorial */}
          <RevealWrapper>
            <div>
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Comunidad
                </p>
              </div>
              <h2
                className="font-display font-black uppercase leading-[0.9] text-[#111111]"
                style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)" }}
              >
                CONSTRUIDA
                <br />
                POR LOS QUE
                <br />
                <span className="text-[#CC4B37]">JUEGAN.</span>
              </h2>
              <p className="mt-6 max-w-lg font-body text-base leading-[1.7] text-[#666666] sm:text-[1.05rem]">
                Cada perfil, equipo y campo registrado suma a la plataforma que todos queríamos.
                AirNation nació del airsoft mexicano y crece desde adentro.
              </p>
              <Link
                href="/register"
                className="group mt-8 inline-flex items-center gap-2.5 bg-[#CC4B37] px-7 py-[1rem] font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-[#CC4B37]/90"
              >
                Únete a la comunidad
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                  className="transition-transform group-hover:translate-x-1"
                >
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
          </RevealWrapper>

          {/* Columna derecha: feed animado */}
          <RevealWrapper delay={0.15}>
            <CommunityActivityFeed />
          </RevealWrapper>
        </div>
      </div>
    </section>
  );
}
