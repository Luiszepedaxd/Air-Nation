'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TG_COLORS, TG_FONTS } from './ui/theme'

const NAV_LINKS = [
  { href: '#briefing', label: 'BRIEFING' },
  { href: '#equipamiento', label: 'EQUIPO' },
  { href: '#sede', label: 'SEDE' },
  { href: '#inscripcion', label: 'INSCRIPCIÓN' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: TG_COLORS.dark,
        borderBottom: scrolled ? `1px solid ${TG_COLORS.olive}` : '1px solid transparent',
      }}
      aria-label="Navegación del evento"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="AirNation">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/airnation-logo-light.png"
            alt="AirNation"
            className="h-6 w-auto md:h-7"
          />
        </Link>

        <div className="hidden gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.7rem] uppercase tracking-[0.28em] text-white/70 transition-colors hover:text-[#D4A017]"
              style={{ fontFamily: TG_FONTS.mono, fontWeight: 400 }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#inscripcion"
          className="md:hidden text-[0.6rem] uppercase tracking-[0.2em] text-white/70"
          style={{ fontFamily: TG_FONTS.mono, fontWeight: 700 }}
        >
          INSCRIPCIÓN
        </a>
      </div>
    </nav>
  )
}
