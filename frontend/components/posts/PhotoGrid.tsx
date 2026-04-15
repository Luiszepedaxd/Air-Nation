'use client'

import { useState, useEffect, useRef, type TouchEvent, type PointerEvent as ReactPointerEvent } from 'react'

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [current, setCurrent] = useState(0)
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef(0)
  const dragOffsetX = useRef(0)
  const baseOffset = useRef(0)

  if (!urls.length) return null

  const count = urls.length

  const slideWidth = () => {
    const track = trackRef.current
    if (!track || !track.children[0]) return 0
    return (track.children[0] as HTMLElement).offsetWidth
  }

  const setTrackX = (x: number, animated: boolean) => {
    const track = trackRef.current
    if (!track) return
    track.style.transition = animated
      ? 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none'
    track.style.transform = `translateX(${x}px)`
  }

  const goTo = (idx: number, animated = true) => {
    const clamped = Math.max(0, Math.min(idx, count - 1))
    setCurrent(clamped)
    setTrackX(-clamped * slideWidth(), animated)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (count <= 1) return
    const track = trackRef.current
    if (!track) return
    track.setPointerCapture(e.pointerId)
    setDragging(false)
    dragStartX.current = e.clientX
    dragOffsetX.current = 0
    baseOffset.current = -current * slideWidth()
    setTrackX(baseOffset.current, false)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (count <= 1) return
    const delta = e.clientX - dragStartX.current
    if (Math.abs(delta) > 5) setDragging(true)
    dragOffsetX.current = delta

    const w = slideWidth()
    const maxOffset = 0
    const minOffset = -(count - 1) * w
    const raw = baseOffset.current + delta
    const resistance = 0.2
    let clamped = raw
    if (raw > maxOffset) clamped = maxOffset + (raw - maxOffset) * resistance
    if (raw < minOffset) clamped = minOffset + (raw - minOffset) * resistance

    setTrackX(clamped, false)
  }

  const onPointerUp = () => {
    if (count <= 1) return
    const w = slideWidth()
    const delta = dragOffsetX.current
    const threshold = w * 0.2
    if (delta < -threshold && current < count - 1) {
      goTo(current + 1)
    } else if (delta > threshold && current > 0) {
      goTo(current - 1)
    } else {
      goTo(current)
    }
    setTimeout(() => setDragging(false), 10)
  }

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox
          urls={urls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <div className="w-full select-none overflow-hidden">
        <div
          ref={trackRef}
          className="flex touch-pan-y"
          style={{
            willChange: 'transform',
            cursor: count <= 1 ? 'default' : dragging ? 'grabbing' : 'grab',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {urls.map((url, i) => (
            <div
              key={i}
              className="aspect-square w-full shrink-0 overflow-hidden bg-[#F4F4F4]"
              onClick={() => {
                if (!dragging) setLightboxIndex(i)
              }}
            >
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover object-center pointer-events-none"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {urls.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-4 bg-[#CC4B37]' : 'w-1.5 bg-[#DDDDDD]'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
