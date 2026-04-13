"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Funciones", href: "#funciones" },
  { label: "Preview",   href: "#preview"   },
  { label: "Comunidad", href: "#comunidad" },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 55);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const linkNav = scrolled
    ? "font-body text-[0.7rem] text-[#333333] hover:text-an-text transition-colors uppercase tracking-[0.18em]"
    : "font-body text-[0.7rem] text-white/90 hover:text-white transition-colors uppercase tracking-[0.18em]";

  const linkLogin = scrolled
    ? "font-body font-bold text-[0.7rem] text-[#333333] hover:text-an-text transition-colors uppercase tracking-[0.15em] px-4 py-2.5"
    : "font-body font-bold text-[0.7rem] text-white/90 hover:text-white transition-colors uppercase tracking-[0.15em] px-4 py-2.5";

  const logoText = scrolled
    ? "font-display font-black text-[1.2rem] tracking-[0.18em] text-an-text uppercase leading-none"
    : "font-display font-black text-[1.2rem] tracking-[0.18em] text-white uppercase leading-none";

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-an-bg border-b border-an-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[4.5rem] flex items-center justify-between gap-8">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-7 h-7 bg-an-accent flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
            </svg>
          </span>
          <span className={logoText}>
            AIR<span className="text-an-accent">NATION</span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={linkNav}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* ── Auth CTAs ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className={linkLogin}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="font-body font-bold text-[0.7rem] text-white bg-an-accent hover:bg-an-accent-h transition-colors uppercase tracking-[0.15em] px-5 py-2.5"
          >
            Registrarse
          </Link>
        </div>

        {/* ── Hamburger ── */}
        <button
          className="md:hidden flex flex-col justify-center gap-[5px] p-2 ml-auto"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          <span
            className={`block w-5 h-0.5 origin-center transition-all duration-200 ${
              scrolled ? "bg-an-text" : "bg-white"
            } ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 transition-opacity duration-200 ${
              scrolled ? "bg-an-text" : "bg-white"
            } ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 origin-center transition-all duration-200 ${
              scrolled ? "bg-an-text" : "bg-white"
            } ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
          />
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="md:hidden bg-an-bg border-t border-an-border">
          <div className="px-5 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="font-body text-sm text-[#333333] uppercase tracking-[0.12em]"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3 border-t border-an-border">
              <Link
                href="/login"
                className="font-body font-bold text-sm text-[#333333] text-center py-3 border border-an-border uppercase tracking-wider hover:bg-an-surface2 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="font-body font-bold text-sm text-white bg-an-accent text-center py-3 uppercase tracking-wider hover:bg-an-accent-h transition-colors"
              >
                Registrarse gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
