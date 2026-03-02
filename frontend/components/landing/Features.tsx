"use client";
import { useRef, useState, useEffect } from "react";

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3L25 8.5v11L14 25 3 19.5v-11L14 3Z" stroke="#2ECC71" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 3v22M3 8.5l11 5.5 11-5.5" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Perfil de Jugador",
    description:
      "Tu alias, equipo, ciudad y rol en un solo lugar. Sin presentarte de nuevo en cada partida.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="5" width="20" height="18" rx="2" stroke="#2ECC71" strokeWidth="1.5"/>
        <circle cx="10" cy="12" r="2.5" stroke="#2ECC71" strokeWidth="1.5"/>
        <path d="M16 10h5M16 14h4" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 20c0-2 5-3 5-3s5 1 5 3" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Credencial Digital",
    description:
      "Tu identificación con QR verificable. Descárgala una vez, úsala siempre.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M8 4h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="#2ECC71" strokeWidth="1.5"/>
        <path d="M10 10h8M10 14h8M10 18h5" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Documentos Oficiales",
    description:
      "Sube y accede a la documentación que necesitas por autoridad. Todo organizado, nada perdido.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M6 10c0-2 1.5-4 4-4h8c2.5 0 4 2 4 4v4c0 4-3 8-8 8s-8-4-8-8v-4Z" stroke="#2ECC71" strokeWidth="1.5"/>
        <path d="M10 14l2 2 4-4" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 4v2M10 5l1 1.5M18 5l-1 1.5" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Registro de Réplicas",
    description:
      "Número de serie, historial y transferencias. Si alguna vez la pierdes, ya tienes cómo demostrar que era tuya.",
  },
];

export default function Features() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = (i: number) => {
    const next = Math.max(0, Math.min(i, features.length - 1));
    setIndex(next);
    scrollRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cards = el.children;
      if (cards.length === 0) return;
      const card = cards[0] as HTMLElement;
      const cardWidth = card.offsetWidth + 16;
      const scrollLeft = el.scrollLeft;
      const i = Math.round(scrollLeft / cardWidth);
      setIndex(Math.max(0, Math.min(i, features.length - 1)));
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section id="funciones" className="py-20 sm:py-28 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-air-border" />
            <span className="font-mono text-xs text-air-muted tracking-widest uppercase">Funciones</span>
            <div className="h-px flex-1 bg-air-border" />
          </div>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] text-center text-air-text tracking-wider leading-none">
            LO QUE LE
            <br />
            <span className="text-gradient-green">FALTABA A LA COMUNIDAD</span>
          </h2>
        </div>

        {/* Carrusel: una card grande centrada + asomo de vecinas */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth pb-4 touch-pan-x -mx-4 pl-[9%] pr-[9%] sm:pl-[9%] sm:pr-[9%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[82%] min-w-[260px] max-w-[420px] snap-center"
              >
                <div className="group relative p-6 sm:p-8 rounded-xl border border-air-border bg-air-surface hover:border-air-green/30 transition-all duration-300 hover:bg-air-surface/80 h-full min-h-[220px]">
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "radial-gradient(ellipse at 30% 30%, rgba(46,204,113,0.04), transparent 60%)" }}
                  />

                  <div className="relative">
                    <div className="mb-4">{f.icon}</div>
                    <h3 className="font-display text-2xl sm:text-3xl tracking-wider text-air-text mb-2">{f.title}</h3>
                    <p className="font-body text-air-text-dim text-sm sm:text-base leading-relaxed">{f.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Solo flechas */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <button
              onClick={() => scrollTo(index - 1)}
              disabled={index === 0}
              className="w-10 h-10 rounded-full border border-air-border flex items-center justify-center text-air-text hover:border-air-green/50 hover:text-air-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Anterior"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => scrollTo(index + 1)}
              disabled={index === features.length - 1}
              className="w-10 h-10 rounded-full border border-air-border flex items-center justify-center text-air-text hover:border-air-green/50 hover:text-air-green disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Siguiente"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
