'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#facciones', label: 'Facciones' },
  { href: '#operativo', label: 'Operativo' },
  { href: '#sede', label: 'Sede' },
  { href: '#inscripcion', label: 'Inscripción' },
]

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('//')
}

export function LandingNav({ ctaLink }: { ctaLink: string }) {
  const [scrolled, setScrolled] = useState(false)
  const ctaExternal = isExternalHref(ctaLink)

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
          ? 'border-b border-white/10 bg-black/80 backdrop-blur-md'
          : 'bg-transparent'
      }`}
      aria-label="Navegación del evento"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16 md:px-8">
        <Link
          href="/"
          className="text-[0.65rem] tracking-[0.25em] text-white md:text-[0.7rem]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
        >
          AIRNATION
        </Link>

        <div className="hidden gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[0.7rem] uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href={ctaLink}
          {...(ctaExternal
            ? { target: '_blank' as const, rel: 'noopener noreferrer' }
            : {})}
          className="bg-[#CC4B37] px-3 py-2 text-[0.6rem] uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#a83b2c] md:px-4 md:py-2.5 md:text-[0.65rem]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
        >
          Inscribirme
        </a>
      </div>
    </nav>
  )
}
