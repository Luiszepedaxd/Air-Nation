'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'

/** Carrusel snap. El fade de cada lado solo aparece si aún hay contenido hacia allá. */
export function CarruselFade({
  children,
  fade = '#141A10',
  className = '',
}: {
  children: ReactNode
  fade?: string
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const fadeL = useRef<HTMLDivElement>(null)
  const fadeR = useRef<HTMLDivElement>(null)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const atRight = scrollLeft + clientWidth >= scrollWidth - 4
    const atLeft = scrollLeft <= 4
    if (fadeR.current) fadeR.current.style.opacity = atRight ? '0' : '1'
    if (fadeL.current) fadeL.current.style.opacity = atLeft ? '0' : '1'
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [update, children])

  return (
    <div className="relative min-w-0 max-w-full">
      <div
        ref={fadeL}
        className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 opacity-0 transition-opacity duration-150"
        style={{ background: `linear-gradient(to left, transparent, ${fade})` }}
        aria-hidden
      />
      <div
        ref={scrollRef}
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>
      <div
        ref={fadeR}
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 transition-opacity duration-150"
        style={{ background: `linear-gradient(to right, transparent, ${fade})` }}
        aria-hidden
      />
    </div>
  )
}
