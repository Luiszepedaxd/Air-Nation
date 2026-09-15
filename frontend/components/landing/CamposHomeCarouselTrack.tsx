'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CampoCard } from '@/app/campos/components/CampoCard'
import type { CampoListRow } from '@/app/campos/types'

export function CamposHomeCarouselTrack({ fields }: { fields: CampoListRow[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    const el = scrollerRef.current
    if (!el) return
    const firstCard = el.querySelector<HTMLElement>('[data-campo-slide]')
    const amount = firstCard
      ? firstCard.offsetWidth + 16
      : Math.min(el.clientWidth * 0.8, 320)
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 border border-[#EEEEEE] bg-[#111111] p-2.5 text-white shadow-sm transition-colors hover:border-[#CC4B37] hover:bg-[#CC4B37] sm:flex"
        aria-label="Campos anteriores"
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 border border-[#EEEEEE] bg-[#111111] p-2.5 text-white shadow-sm transition-colors hover:border-[#CC4B37] hover:bg-[#CC4B37] sm:flex"
        aria-label="Campos siguientes"
      >
        <ChevronRight size={18} strokeWidth={2} />
      </button>

      <div className="-mx-5 sm:mx-0 sm:px-10">
        <div
          ref={scrollerRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 sm:gap-5"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingLeft: '1.25rem',
            paddingRight: '1.25rem',
            scrollPaddingLeft: '1.25rem',
            scrollPaddingRight: '1.25rem',
          }}
        >
          {fields.map((field, i) => (
            <div
              key={field.id}
              data-campo-slide
              className={`w-[82%] shrink-0 snap-start sm:w-[280px] lg:w-[300px] ${
                i === fields.length - 1 ? 'pr-5 sm:pr-0' : ''
              }`}
              style={{
                scrollSnapAlign:
                  i === 0
                    ? 'start'
                    : i === fields.length - 1
                      ? 'end'
                      : 'start',
              }}
            >
              <CampoCard field={field} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
