'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'

export function ScrollableTabsNav({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const fadeRRef = useRef<HTMLDivElement>(null)
  const fadeLRef = useRef<HTMLDivElement>(null)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const atRight = scrollLeft + clientWidth >= scrollWidth - 4
    const atLeft = scrollLeft <= 4
    if (fadeRRef.current) fadeRRef.current.style.opacity = atRight ? '0' : '1'
    if (fadeLRef.current) fadeLRef.current.style.opacity = atLeft ? '0' : '1'
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
  }, [update])

  return (
    <div className="relative">
      <div
        ref={fadeLRef}
        className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-10 transition-opacity duration-150"
        style={{
          background:
            'linear-gradient(to left, transparent, #FFFFFF)',
          opacity: 0,
        }}
        aria-hidden
      />
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>
      <div
        ref={fadeRRef}
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-10 transition-opacity duration-150"
        style={{
          background:
            'linear-gradient(to right, transparent, #FFFFFF)',
          opacity: 1,
        }}
        aria-hidden
      />
    </div>
  )
}
