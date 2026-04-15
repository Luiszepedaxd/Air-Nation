'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export function Carrusel({ children, className = '' }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const [dragging, setDragging] = useState(false)

  const dragStartX = useRef(0)
  const dragOffsetX = useRef(0)
  const baseOffset = useRef(0)

  const slideWidth = useCallback(() => {
    const track = trackRef.current
    if (!track || !track.children[0]) return 0
    return (track.children[0] as HTMLElement).offsetWidth
  }, [])

  const setTrackX = (x: number, animated: boolean) => {
    const track = trackRef.current
    if (!track) return
    track.style.transition = animated
      ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none'
    track.style.transform = `translateX(${x}px)`
  }

  const goTo = useCallback(
    (idx: number, animated = true) => {
      const w = slideWidth()
      const clamped = Math.max(0, Math.min(idx, count - 1))
      setCurrent(clamped)
      setTrackX(-clamped * w, animated)
    },
    [count, slideWidth]
  )

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const n = track.children.length
    setCount(n)
    setCurrent(0)
    setTrackX(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children])

  useEffect(() => {
    const handler = () => goTo(current, false)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [current, goTo])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return
    track.setPointerCapture(e.pointerId)
    setDragging(true)
    dragStartX.current = e.clientX
    dragOffsetX.current = 0
    baseOffset.current = -current * slideWidth()
    setTrackX(baseOffset.current, false)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const delta = e.clientX - dragStartX.current
    dragOffsetX.current = delta
    setTrackX(baseOffset.current + delta, false)
  }

  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    const w = slideWidth()
    const threshold = w * 0.2
    const delta = dragOffsetX.current

    if (delta < -threshold) {
      goTo(current + 1)
    } else if (delta > threshold) {
      goTo(current - 1)
    } else {
      goTo(current)
    }
  }

  return (
    <div className={`w-full select-none overflow-hidden ${className}`}>
      <div
        ref={trackRef}
        className="flex touch-pan-y"
        style={{ willChange: 'transform', cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-4 bg-[#CC4B37]'
                  : 'w-1.5 bg-[#DDDDDD]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
