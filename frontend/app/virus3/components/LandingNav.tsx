'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#facciones', label: 'Facciones' },
  { href: '#sede', label: 'Sede' },
  { href: '#inscripcion', label: 'Inscripción' },
  { href: '#cronograma', label: 'Cronograma' },
]

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#E5E0DA] bg-[#FFFFFF]/95 backdrop-blur-md'
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
                  ? 'text-[#666666] hover:text-[#111111]'
                  : 'text-white/80 hover:text-white'
              }`}
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
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
