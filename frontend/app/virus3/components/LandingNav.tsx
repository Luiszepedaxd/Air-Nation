'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#facciones', label: 'Facciones' },
  { href: '#sede', label: 'Sede' },
  { href: '#inscripcion', label: 'Inscripción' },
  { href: '#cronograma', label: 'Cronograma' },
]

export function LandingNav({ audioUrl }: { audioUrl?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      try {
        await el.play()
        setPlaying(true)
      } catch {
        // autoplay bloqueado por browser — ok
      }
    }
  }

  return (
    <>
      {audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio ref={audioRef} src={audioUrl} loop preload="metadata" />
      )}

      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
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

          <div className="flex items-center gap-3">
            {audioUrl && (
              <button
                onClick={togglePlay}
                aria-label={playing ? 'Pausar música' : 'Reproducir música'}
                className={`relative flex h-8 w-8 items-center justify-center transition-all ${
                  scrolled
                    ? 'bg-[#111111] text-white hover:bg-[#CC4B37]'
                    : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
                }`}
                style={{ borderRadius: 2 }}
              >
                {playing ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <rect x="5" y="3" width="5" height="18" rx="1" />
                    <rect x="14" y="3" width="5" height="18" rx="1" />
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                )}
                {playing && (
                  <span className="pointer-events-none absolute h-8 w-8 animate-ping rounded-sm bg-[#CC4B37]/30" />
                )}
              </button>
            )}

            <Link
              href="/register"
              className="bg-[#CC4B37] px-3 py-2 text-[0.6rem] uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 md:px-4 md:py-2.5 md:text-[0.65rem]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
