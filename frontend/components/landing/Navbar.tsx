"use client";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-air-bg/95 backdrop-blur-sm border-b border-air-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded bg-air-green flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="#0D0F0E" strokeWidth="0"/>
            </svg>
          </span>
          <span className="font-display text-2xl tracking-widest text-air-text">
            AIR<span className="text-air-green">NATION</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {["Funciones", "Cómo funciona", "Únete"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-").replace("ó", "o").replace("é", "e")}`}
              className="text-air-text-dim hover:text-air-text text-sm font-body transition-colors"
            >
              {item}
            </a>
          ))}
          <a
            href="#unete"
            className="px-4 py-2 bg-air-green text-air-bg text-sm font-body font-semibold rounded hover:bg-opacity-90 transition-all"
          >
            Registrar equipo
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`w-5 h-0.5 bg-air-text transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-5 h-0.5 bg-air-text transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`w-5 h-0.5 bg-air-text transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-air-surface border-t border-air-border px-4 py-4 flex flex-col gap-4">
          {["Funciones", "Cómo funciona", "Únete"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-air-text-dim text-sm font-body"
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <a
            href="#unete"
            className="px-4 py-2 bg-air-green text-air-bg text-sm font-semibold rounded text-center"
            onClick={() => setMenuOpen(false)}
          >
            Registrar equipo
          </a>
        </div>
      )}
    </nav>
  );
}
