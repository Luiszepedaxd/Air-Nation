'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#briefing', label: 'Briefing' },
  { href: '#equipamiento', label: 'Equipo' },
  { href: '#sede', label: 'Sede' },
  { href: '#inscripcion', label: 'Inscripción' },
]

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#C4B89C] bg-white/95 backdrop-blur-md'
          : 'bg-transparent'
      }`}
      aria-label="Navegación del evento"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-8">
        <Link
          href="/"
          className={`text-[0.65rem] tracking-[0.25em] transition-colors md:text-[0.7rem] ${
            scrolled ? 'text-[#111111]' : 'text-white'
          }`}
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
        >
          AIRNATION
        </Link>

        <div className="hidden gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-[0.7rem] uppercase tracking-[0.18em] transition-colors ${
                scrolled
                  ? 'text-[#4A5328] hover:text-[#111111]'
                  : 'text-white/80 hover:text-white'
              }`}
              style={{ fontFamily: MONO, fontWeight: 400 }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <Link
          href="/register"
          className="bg-[#CC4B37] px-3 py-2 text-[0.6rem] uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 md:px-4 md:py-2.5 md:text-[0.65rem]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
        >
          Crear cuenta
        </Link>
      </div>
    </nav>
  )
}
