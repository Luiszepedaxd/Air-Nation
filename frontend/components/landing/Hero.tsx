export const revalidate = 0;

import Link from "next/link";
import { getSiteAssets } from "@/lib/site-assets";

export default async function Hero() {
  const assets = await getSiteAssets();
  const heroUrl =
    assets["home_hero_background"] ?? assets["hero_background"] ?? "/herofoto2.jpg";

  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#111111]">
      {/* 1. Foto de fondo con Ken Burns effect */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <img
          src={heroUrl}
          alt=""
          className="absolute inset-0 h-full w-full min-h-full min-w-full animate-an-ken-burns object-cover object-center"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* 2. Overlay oscuro */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#111111] via-[#111111]/65 to-[#111111]/15"
        aria-hidden
      />

      {/* 3. Fade inferior hacia blanco */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-48 bg-gradient-to-t from-white to-transparent"
        aria-hidden
      />

      {/* 4. Contenido */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-40 pt-24 sm:px-8 sm:pb-48 sm:pt-28">
        <div className="max-w-[600px] lg:max-w-[680px]">
          {/* H1 con animación stagger */}
          <h1
            className="mb-6 font-display font-black uppercase leading-[0.88] text-white"
            style={{ fontSize: "clamp(3rem, 9.5vw, 7.5rem)" }}
          >
            <span
              className="block animate-an-slide-up"
              style={{ animationDelay: "0.1s", animationFillMode: "both" }}
            >
              TU IDENTIDAD.
            </span>
            <span
              className="block animate-an-slide-up"
              style={{ animationDelay: "0.3s", animationFillMode: "both" }}
            >
              TU EQUIPO.
            </span>
            <span
              className="block animate-an-slide-up text-an-accent"
              style={{ animationDelay: "0.5s", animationFillMode: "both" }}
            >
              TU CAMPO.
            </span>
          </h1>

          {/* CTAs con glow */}
          <div
            className="flex flex-col gap-3 animate-an-fade-in sm:flex-row"
            style={{ animationDelay: "0.8s", animationFillMode: "both" }}
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden bg-an-accent px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-an-accent-h"
            >
              <span
                className="absolute inset-0 -z-10 animate-an-glow-pulse rounded-none bg-an-accent opacity-0"
                aria-hidden
              />
              Crear cuenta gratis
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
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-white/35 px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white/90 transition-colors hover:border-white hover:text-white"
            >
              Ya tengo cuenta
            </Link>
          </div>

          {/* Disclaimer TyC */}
          <p
            className="mt-5 max-w-[600px] animate-an-fade-in font-body text-[0.7rem] leading-relaxed text-white/55 sm:text-xs"
            style={{ animationDelay: "1s", animationFillMode: "both" }}
          >
            Al crear cuenta aceptas los{" "}
            <Link
              href="/terminos"
              className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white"
            >
              Términos y Condiciones
            </Link>{" "}
            y el{" "}
            <Link
              href="/privacidad"
              className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white"
            >
              Aviso de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>

      {/* 5. Indicador de scroll abajo */}
      <div
        className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2 animate-an-fade-in"
        style={{ animationDelay: "1.4s", animationFillMode: "both" }}
      >
        <div className="animate-an-bounce-slow flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 9l6 6 6-6"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
