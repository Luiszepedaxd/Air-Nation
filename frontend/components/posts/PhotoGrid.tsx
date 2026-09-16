'use client'

import { useState, useEffect, useRef, type TouchEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { feedPhotoSrcSet, lightboxImageUrl } from '@/lib/media-url'
import { FeedInlineVideo } from '@/components/feed/FeedInlineVideo'

function FeedImg({
  url,
  priority,
  className,
}: {
  url: string
  priority?: boolean
  className?: string
}) {
  const meta = feedPhotoSrcSet(url)
  const [src, setSrc] = useState(meta.src)
  const [srcSet, setSrcSet] = useState(meta.srcSet)
  const fellBack = useRef(false)

  useEffect(() => {
    const next = feedPhotoSrcSet(url)
    setSrc(next.src)
    setSrcSet(next.srcSet)
    fellBack.current = false
  }, [url])

  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes={meta.sizes}
      alt=""
      className={className}
      draggable={false}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      onError={() => {
        if (fellBack.current) return
        fellBack.current = true
        setSrc(meta.original)
        setSrcSet('')
      }}
    />
  )
}

export function Lightbox({ urls, startIndex, onClose }: {
  urls: string[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const dragging = useRef(false)
  const [lbSrc, setLbSrc] = useState(() => lightboxImageUrl(urls[startIndex] ?? ''))
  const lbFellBack = useRef(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, urls.length - 1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [urls.length, onClose])

  useEffect(() => {
    const raw = urls[idx] ?? ''
    setLbSrc(lightboxImageUrl(raw))
    lbFellBack.current = false
  }, [idx, urls])

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
      if (dx < 0) setIdx(i => Math.min(i + 1, urls.length - 1))
      else setIdx(i => Math.max(i - 1, 0))
    } else if (absDy > absDx && absDy > 80) {
      if (dy > 0) onClose()
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  const handleOverlayClick = () => {
    if (!dragging.current) onClose()
  }

  const original = urls[idx] ?? ''

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 touch-none"
      onClick={handleOverlayClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 text-white p-2 z-10"
        aria-label="Cerrar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

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

      <img
        src={lbSrc}
        alt=""
        loading="eager"
        decoding="async"
        className="max-h-[90vh] max-w-[95vw] object-contain select-none pointer-events-none"
        onError={() => {
          if (lbFellBack.current || !original) return
          lbFellBack.current = true
          setLbSrc(original)
        }}
      />

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

export type PostMediaVideo = {
  src: string
  videoMp4Url?: string | null
  poster?: string | null
}

/**
 * Horizontal carousel for feed photos (and optional video slide).
 * Uses transform (not overflow-x scroll) so vertical feed scroll still
 * works when the finger starts on a photo — only horizontal locks the axis.
 */
export function PhotoGrid({
  urls,
  priorityCount = 1,
  video = null,
}: {
  urls: string[]
  /** First N slides load eager (above-the-fold). */
  priorityCount?: number
  /** Optional video rendered as the last carousel slide. */
  video?: PostMediaVideo | null
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const dragMoved = useRef(false)
  const axisLock = useRef<'x' | 'y' | null>(null)
  const pointerStart = useRef<{ x: number; y: number; base: number } | null>(null)

  const photos = urls.filter(Boolean)
  const hasVideo = Boolean(video?.src)
  const slideCount = photos.length + (hasVideo ? 1 : 0)

  if (slideCount === 0) return null

  const slideWidth = () => viewportRef.current?.clientWidth ?? 0

  const setTrackX = (x: number, animated: boolean) => {
    const track = trackRef.current
    if (!track) return
    track.style.transition = animated
      ? 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none'
    track.style.transform = `translate3d(${x}px,0,0)`
  }

  const goTo = (idx: number, animated = true) => {
    const clamped = Math.max(0, Math.min(idx, slideCount - 1))
    setCurrent(clamped)
    setTrackX(-clamped * slideWidth(), animated)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (slideCount <= 1) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const track = trackRef.current
    if (!track) return
    try {
      track.setPointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    dragMoved.current = false
    axisLock.current = null
    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
      base: -current * slideWidth(),
    }
    setTrackX(-current * slideWidth(), false)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start || slideCount <= 1) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y

    if (axisLock.current == null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      // Vertical intent → release and let the feed scroll.
      if (Math.abs(dy) > Math.abs(dx)) {
        axisLock.current = 'y'
        pointerStart.current = null
        try {
          trackRef.current?.releasePointerCapture(e.pointerId)
        } catch {
          /* noop */
        }
        goTo(current, true)
        return
      }
      axisLock.current = 'x'
    }

    if (axisLock.current !== 'x') return

    dragMoved.current = true
    e.preventDefault()
    const w = slideWidth()
    const maxOffset = 0
    const minOffset = -(slideCount - 1) * w
    const raw = start.base + dx
    const resistance = 0.25
    let clamped = raw
    if (raw > maxOffset) clamped = maxOffset + (raw - maxOffset) * resistance
    if (raw < minOffset) clamped = minOffset + (raw - minOffset) * resistance
    setTrackX(clamped, false)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    const lock = axisLock.current
    pointerStart.current = null
    axisLock.current = null
    if (slideCount <= 1 || !start || lock !== 'x') {
      setTimeout(() => {
        dragMoved.current = false
      }, 10)
      return
    }
    const dx = e.clientX - start.x
    const w = slideWidth()
    const threshold = Math.max(40, w * 0.18)
    if (dx < -threshold && current < slideCount - 1) goTo(current + 1)
    else if (dx > threshold && current > 0) goTo(current - 1)
    else goTo(current)
    setTimeout(() => {
      dragMoved.current = false
    }, 10)
  }

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox
          urls={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <div className="w-full min-w-0 select-none">
        <div
          ref={viewportRef}
          className="w-full overflow-hidden"
          style={{ touchAction: 'pan-y' }}
        >
          <div
            ref={trackRef}
            className="flex flex-nowrap will-change-transform"
            style={{ transform: `translate3d(${-current * 100}%,0,0)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {photos.map((url, i) => (
              <div
                key={`photo-${i}`}
                className="aspect-square w-full min-w-full max-w-full flex-[0_0_100%] overflow-hidden bg-[#F4F4F4]"
                onClick={() => {
                  if (!dragMoved.current) setLightboxIndex(i)
                }}
              >
                <FeedImg
                  url={url}
                  priority={i < priorityCount}
                  className="pointer-events-none h-full w-full object-cover object-center"
                />
              </div>
            ))}

            {hasVideo && video ? (
              <div
                key="video"
                className="aspect-square w-full min-w-full max-w-full flex-[0_0_100%] overflow-hidden bg-black"
              >
                <FeedInlineVideo
                  src={video.src}
                  videoMp4Url={video.videoMp4Url}
                  poster={video.poster}
                  forceSquare
                />
              </div>
            ) : null}
          </div>
        </div>

        {slideCount > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {Array.from({ length: slideCount }).map((_, i) => (
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

/**
 * Feed media block: photos and/or video in one intentional layout.
 * - photos only → horizontal snap carousel
 * - video only → inline video
 * - both → single carousel with video as last slide (no vertical stack)
 */
export function PostMedia({
  urls,
  video,
  priorityCount = 1,
}: {
  urls?: string[] | null
  video?: PostMediaVideo | null
  priorityCount?: number
}) {
  const photos = (urls ?? []).filter(Boolean)
  const hasVideo = Boolean(video?.src)

  if (photos.length === 0 && !hasVideo) return null

  if (photos.length === 0 && hasVideo && video) {
    return (
      <FeedInlineVideo
        src={video.src}
        videoMp4Url={video.videoMp4Url}
        poster={video.poster}
      />
    )
  }

  return (
    <PhotoGrid
      urls={photos}
      priorityCount={priorityCount}
      video={hasVideo ? video : null}
    />
  )
}
