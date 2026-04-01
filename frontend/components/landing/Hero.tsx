// No "use client" needed — no hooks
import Link from "next/link";

const STATS = [
  { num: "100%",  label: "Gratis para empezar"            },
  { num: "5",     label: "Herramientas en una plataforma" },
  { num: "MX",    label: "Lanzamiento inicial"            },
];

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#111111]">

      {/* 1. Foto — fondo (estática en /public) */}
      <img
        src="/herofoto2.jpg"
        alt="Airsoft — jugadores en acción"
        className="absolute inset-0 z-0 h-full w-full min-h-full min-w-full object-cover object-center"
        loading="eager"
        decoding="async"
      />

      {/* 2. Overlay oscuro */}
      <div
        className="absolute inset-0 z-[1] bg-gradient-to-r from-[#111111] via-[#111111]/85 to-[#111111]/40 pointer-events-none"
        aria-hidden
      />

      {/* 3. Fade inferior hacia blanco */}
      <div
        className="absolute inset-x-0 bottom-0 z-[2] h-48 bg-gradient-to-t from-white to-transparent pointer-events-none"
        aria-hidden
      />

      {/* 4. Contenido */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-40 pt-24 sm:px-8 sm:pb-48 sm:pt-28">
        <div className="max-w-[600px] lg:max-w-[680px]">

          {/* H1 */}
          <h1
            className="mb-6 font-display font-black uppercase leading-[0.88] text-white"
            style={{ fontSize: "clamp(3rem, 9.5vw, 7.5rem)" }}
          >
            TU IDENTIDAD.
            <br />
            TU EQUIPO.
            <br />
            <span className="text-an-accent">TU CAMPO.</span>
          </h1>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-[1.1rem] bg-an-accent text-white font-body font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:bg-an-accent-h transition-colors"
            >
              Crear cuenta gratis
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                  stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-[1.1rem] border border-white/35 text-white/90 font-body font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:border-white hover:text-white transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-0 inset-x-0 z-10 border-t border-an-border bg-an-bg">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-3 divide-x divide-an-border">
            {STATS.map(({ num, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center text-center py-5 px-3"
              >
                <span className="font-display font-black text-xl sm:text-2xl uppercase text-an-text leading-none">
                  {num}
                </span>
                <span className="font-body text-an-text-dim text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.12em] mt-1.5 leading-snug">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
