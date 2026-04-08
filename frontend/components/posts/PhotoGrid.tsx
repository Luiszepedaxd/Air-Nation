'use client'

import { useState, useEffect, useRef, type TouchEvent } from 'react'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800,
  textTransform: 'uppercase' as const } as const

export function Lightbox({ urls, startIndex, onClose }: {
  urls: string[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, urls.length - 1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [urls.length, onClose])

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    dragging.current = false
  }

  const onTouchMove = (e: TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    if (dx > 10) dragging.current = true
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > absDy && absDx > 40) {
      // swipe horizontal
      if (dx < 0) setIdx(i => Math.min(i + 1, urls.length - 1))
      else setIdx(i => Math.max(i - 1, 0))
    } else if (absDy > absDx && absDy > 80) {
      // swipe vertical hacia abajo → cerrar
      if (dy > 0) onClose()
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  const handleOverlayClick = () => {
    if (!dragging.current) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 touch-none"
      onClick={handleOverlayClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Botón cerrar */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 text-white p-2 z-10"
        aria-label="Cerrar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Flecha anterior — solo desktop */}
      {urls.length > 1 && idx > 0 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 z-10 hidden md:block"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Imagen — SIN stopPropagation en touch */}
      <img
        src={urls[idx]}
        alt=""
        className="max-h-[90vh] max-w-[95vw] object-contain select-none pointer-events-none"
      />

      {/* Flecha siguiente — solo desktop */}
      {urls.length > 1 && idx < urls.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 z-10 hidden md:block"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Dots indicadores */}
      {urls.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {urls.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === idx ? 'bg-white scale-125' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PhotoGrid({ urls }: { urls: string[] }) {
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 })
  if (!urls.length) return null

  const open = (i: number) => setLightbox({ open: true, index: i })

  return (
    <>
      {lightbox.open && (
        <Lightbox urls={urls} startIndex={lightbox.index} onClose={() => setLightbox({ open: false, index: 0 })} />
      )}
      {urls.length === 1 && (
        <div className="aspect-[4/3] w-full overflow-hidden bg-[#F4F4F4] cursor-pointer" onClick={() => open(0)}>
          <img src={urls[0]} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      {urls.length === 2 && (
        <div className="grid grid-cols-2 gap-[2px]">
          {urls.map((url, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-[#F4F4F4] cursor-pointer" onClick={() => open(i)}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      {urls.length === 3 && (
        <div className="grid grid-cols-2 gap-[2px]">
          <div className="row-span-2 aspect-[2/3] overflow-hidden bg-[#F4F4F4] cursor-pointer" onClick={() => open(0)}>
            <img src={urls[0]} alt="" className="w-full h-full object-cover" />
          </div>
          {urls.slice(1).map((url, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-[#F4F4F4] cursor-pointer" onClick={() => open(i + 1)}>
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
      {urls.length >= 4 && (
        <div className="grid grid-cols-2 gap-[2px]">
          {urls.slice(0, 4).map((url, i) => (
            <div key={i} className="relative aspect-square overflow-hidden bg-[#F4F4F4] cursor-pointer" onClick={() => open(i)}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 3 && urls.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-[18px] font-extrabold" style={jost}>+{urls.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
