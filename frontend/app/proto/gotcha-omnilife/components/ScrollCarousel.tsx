'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { jost } from '../theme'

interface ScrollCarouselProps {
  children: React.ReactNode
  className?: string
  showArrows?: boolean
  label?: string
}

export function ScrollCarousel({
  children,
  className = '',
  showArrows = true,
  label,
}: ScrollCarouselProps) {
  const ref = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    const el = ref.current
    if (!el) return
    const amount = Math.min(el.clientWidth * 0.85, 320)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className={className}>
      {label && (
        <p
          className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#999999]"
          style={jost}
        >
          {label}
        </p>
      )}
      <div className="relative">
        {showArrows && (
          <>
            <button
              type="button"
              onClick={() => scroll('left')}
              className="absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 border border-[#EEEEEE] bg-[#FFFFFF] p-1.5 shadow-sm transition-opacity hover:border-[#CC4B37] sm:flex"
              aria-label="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 border border-[#EEEEEE] bg-[#FFFFFF] p-1.5 shadow-sm transition-opacity hover:border-[#CC4B37] sm:flex"
              aria-label="Siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
