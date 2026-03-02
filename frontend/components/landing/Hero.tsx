"use client";
import { useEffect, useRef } from "react";

export default function Hero() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      gridRef.current.style.setProperty("--mx", `${x}%`);
      gridRef.current.style.setProperty("--my", `${y}%`);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-20 pb-16 overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(46,204,113,0.08) 0%, transparent 70%)",
      }}
    >
      {/* Tactical grid background */}
      <div
        ref={gridRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28,42,32,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28,42,32,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 80% at var(--mx, 50%) var(--my, 50%), black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at var(--mx, 50%) var(--my, 50%), black 0%, transparent 70%)",
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-24 left-6 sm:left-12 hidden sm:block">
        <div className="w-8 h-8 border-l-2 border-t-2 border-air-green opacity-40" />
      </div>
      <div className="absolute top-24 right-6 sm:right-12 hidden sm:block">
        <div className="w-8 h-8 border-r-2 border-t-2 border-air-green opacity-40" />
      </div>

      {/* Badge */}
      <div className="mb-6 flex items-center gap-2 px-3 py-1.5 border border-air-green/30 rounded-full bg-air-green/5">
        <span className="w-1.5 h-1.5 rounded-full bg-air-green animate-pulse" />
        <span className="text-air-green text-xs font-mono tracking-widest uppercase">
          Hecho para jugadores de airsoft en México
        </span>
      </div>

      {/* Main heading */}
      <h1 className="font-display text-center leading-none tracking-wider mb-4">
        <span
          className="block text-[clamp(3.5rem,12vw,9rem)] text-air-text"
          style={{ textShadow: "0 0 80px rgba(46,204,113,0.15)" }}
        >
          TU IDENTIDAD
        </span>
        <span
          className="block text-[clamp(3.5rem,12vw,9rem)] text-gradient-green"
          style={{ filter: "drop-shadow(0 0 30px rgba(46,204,113,0.3))" }}
        >
          EN EL CAMPO
        </span>
      </h1>

      {/* Subtitle */}
      <p className="font-body text-air-text-dim text-center max-w-xl text-base sm:text-lg mt-4 mb-10 leading-relaxed">
        Tu credencial, tus réplicas y los documentos que necesitas — siempre en el cel, siempre listos para el campo.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none sm:w-auto">
        <a
          href="#unete"
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-air-green text-air-bg font-body font-semibold rounded transition-all hover:brightness-110 hover:shadow-lg hover:shadow-air-green/20 text-sm sm:text-base"
        >
          Registrarme gratis →
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
        <a
          href="#funciones"
          className="flex items-center justify-center gap-2 px-6 py-3.5 border border-air-border text-air-text-dim font-body rounded hover:border-air-green/40 hover:text-air-text transition-all text-sm sm:text-base"
        >
          Ver funciones
        </a>
      </div>

      {/* Stats row */}
      <div className="mt-16 sm:mt-20 grid grid-cols-3 gap-4 sm:gap-12 w-full max-w-lg">
        {[
          { num: "100%", label: "Gratis para empezar" },
          { num: "Airsoft", label: "Hecho para equipos" },
          { num: "MX", label: "Pensado para la escena local" },
        ].map(({ num, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <span className="font-display text-lg sm:text-2xl text-air-green tracking-wider">{num}</span>
            <span className="font-body text-air-text-dim text-xs sm:text-sm">{label}</span>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-50">
        <span className="text-air-text-dim text-xs font-mono">scroll</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="#7A9980" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  );
}
