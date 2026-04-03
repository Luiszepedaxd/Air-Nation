'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M8.75 3.5L5.25 7l3.5 3.5"
        stroke="#111111"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M5.25 3.5L8.75 7l-3.5 3.5"
        stroke="#111111"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Carrusel({ children, className = '' }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanLeft(scrollLeft > 2)
    setCanRight(scrollLeft + clientWidth < scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    const ro = new ResizeObserver(() => updateArrows())
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [updateArrows, children])

  const scrollByDir = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' })
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={scrollerRef}
        className="flex flex-row snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] [-ms-overflow-style:none] md:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollByDir(-1)}
        className={`absolute left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#EEEEEE] bg-[#F4F4F4] md:flex ${
          canLeft ? '' : 'pointer-events-none invisible'
        }`}
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => scrollByDir(1)}
        className={`absolute right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#EEEEEE] bg-[#F4F4F4] md:flex ${
          canRight ? '' : 'pointer-events-none invisible'
        }`}
      >
        <ChevronRight />
      </button>
    </div>
  )
}
