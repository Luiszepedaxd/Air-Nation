'use client'

import { useState, useEffect, useRef, type TouchEvent, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { clampFeedAspect, feedPhotoSrcSet, lightboxImageUrl } from '@/lib/media-url'
import {
  clampFeedZoom,
  zoomKeepingPoint,
  FEED_ZOOM_DOUBLE,
  FEED_ZOOM_RESET,
  type FeedZoom,
} from '@/lib/feed-zoom'
import { FeedInlineVideo } from '@/components/feed/FeedInlineVideo'

function FeedImg({
  url,
  priority,
  className,
  onLoad,
}: {
  url: string
  priority?: boolean
  className?: string
  onLoad?: (img: HTMLImageElement) => void
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

  const report = (img: HTMLImageElement) => {
    if (img.naturalWidth) onLoad?.(img)
  }

  return (
    <img
      ref={(node) => {
        // Cached images can finish before React binds onLoad.
        if (node?.complete) report(node)
      }}
      src={src}
      srcSet={srcSet || undefined}
      sizes={meta.sizes}
      alt=""
      className={className}
      draggable={false}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
      onLoad={(e) => report(e.currentTarget)}
      onError={() => {
        if (fellBack.current) return
        fellBack.current = true
        setSrc(meta.original)
        setSrcSet('')
      }}
    />
  )
}

function FeedPhotoFrame({
  url,
  priority,
  onAspect,
}: {
  url: string
  priority?: boolean
  /** Primera foto del post: fija la proporción del carrusel. */
  onAspect?: (width: number, height: number) => void
}) {
  return (
    <div className="relative h-full w-full bg-[#111111]">
      {/* ponytail: object-cover solo recorta lo que se pasa de 4:5–1.91.
          La foto entera se ve en el lightbox. No vuelve el crop de subida. */}
      <FeedImg
        url={url}
        priority={priority}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        onLoad={(img) => onAspect?.(img.naturalWidth, img.naturalHeight)}
      />
    </div>
  )
}

type PinchGesture = {
  mode: 'pinch'
  dist: number
  zoom: FeedZoom
  fx: number
  fy: number
}

type DragGesture = {
  mode: 'drag'
  x: number
  y: number
  zoom: FeedZoom
  moved: boolean
}

function focalFrom(img: HTMLImageElement, clientX: number, clientY: number) {
  const r = img.getBoundingClientRect()
  return {
    x: clientX - (r.left + r.width / 2),
    y: clientY - (r.top + r.height / 2),
    w: img.clientWidth,
    h: img.clientHeight,
  }
}

function touchDist(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

export function Lightbox({ urls, startIndex, onClose }: {
  urls: string[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const [zoom, setZoom] = useState<FeedZoom>(FEED_ZOOM_RESET)
  const [gesturing, setGesturing] = useState(false)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const imgRef = useRef<HTMLImageElement>(null)
  const gesture = useRef<PinchGesture | DragGesture | null>(null)
  const moved = useRef(false)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const [lbSrc, setLbSrc] = useState(() => lightboxImageUrl(urls[startIndex] ?? ''))
  const lbFellBack = useRef(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, urls.length - 1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = prevOverflow
    }
  }, [urls.length, onClose])

  useEffect(() => {
    const raw = urls[idx] ?? ''
    setLbSrc(lightboxImageUrl(raw))
    lbFellBack.current = false
    setZoom(FEED_ZOOM_RESET)
    gesture.current = null
    lastTap.current = null
  }, [idx, urls])

  const applyZoomAt = (clientX: number, clientY: number, nextScale: number) => {
    const img = imgRef.current
    if (!img) return
    const f = focalFrom(img, clientX, clientY)
    const start = zoomRef.current
    setZoom(zoomKeepingPoint(start, nextScale, f.x, f.y, f.x, f.y, f.w, f.h))
  }

  const onTouchStart = (e: TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const img = imgRef.current
    if (!img) return
    setGesturing(true)
    if (e.touches.length >= 2) {
      const f = focalFrom(
        img,
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2,
      )
      gesture.current = {
        mode: 'pinch',
        dist: Math.max(1, touchDist(e.touches[0], e.touches[1])),
        zoom: zoomRef.current,
        fx: f.x,
        fy: f.y,
      }
      moved.current = true
      return
    }
    gesture.current = {
      mode: 'drag',
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      zoom: zoomRef.current,
      moved: false,
    }
    moved.current = false
  }

  const onTouchMove = (e: TouchEvent) => {
    const img = imgRef.current
    const g = gesture.current
    if (!img || !g) return
    if (e.touches.length >= 2) {
      const dist = Math.max(1, touchDist(e.touches[0], e.touches[1]))
      const f = focalFrom(
        img,
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2,
      )
      const base = g.mode === 'pinch' ? g : {
        mode: 'pinch' as const,
        dist,
        zoom: zoomRef.current,
        fx: f.x,
        fy: f.y,
      }
      if (g.mode !== 'pinch') gesture.current = base
      const start = g.mode === 'pinch' ? g : base
      setZoom(zoomKeepingPoint(
        start.zoom,
        start.zoom.scale * (dist / start.dist),
        start.fx,
        start.fy,
        f.x,
        f.y,
        img.clientWidth,
        img.clientHeight,
      ))
      moved.current = true
      return
    }
    if (g.mode !== 'drag' || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - g.x
    const dy = e.touches[0].clientY - g.y
    if (Math.hypot(dx, dy) > 8) {
      g.moved = true
      moved.current = true
    }
    if (g.zoom.scale > 1) {
      setZoom(clampFeedZoom(
        g.zoom.scale,
        g.zoom.x + dx,
        g.zoom.y + dy,
        img.clientWidth,
        img.clientHeight,
      ))
    }
  }

  const onTouchEnd = (e: TouchEvent) => {
    const g = gesture.current
    if (e.touches.length >= 1) return
    setGesturing(false)
    gesture.current = null
    if (!g) return

    if (zoomRef.current.scale < 1.05) {
      zoomRef.current = FEED_ZOOM_RESET
      setZoom(FEED_ZOOM_RESET)
    }

    if (g.mode === 'pinch') return

    const x = e.changedTouches[0].clientX
    const y = e.changedTouches[0].clientY

    if (!g.moved) {
      const now = Date.now()
      const prev = lastTap.current
      if (prev && now - prev.t < 300 && Math.hypot(x - prev.x, y - prev.y) < 28) {
        lastTap.current = null
        const next = zoomRef.current.scale > 1 ? 1 : FEED_ZOOM_DOUBLE
        applyZoomAt(x, y, next)
      } else {
        lastTap.current = { t: now, x, y }
      }
      return
    }

    if (g.zoom.scale > 1) return

    const dx = x - g.x
    const dy = y - g.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > absDy && absDx > 40) {
      if (dx < 0) setIdx(i => Math.min(i + 1, urls.length - 1))
      else setIdx(i => Math.max(i - 1, 0))
      return
    }
    if (absDy > absDx && dy > 80) onClose()
  }

  const onDoubleClick = (e: ReactMouseEvent<HTMLImageElement>) => {
    e.stopPropagation()
    e.preventDefault()
    const next = zoomRef.current.scale > 1 ? 1 : FEED_ZOOM_DOUBLE
    applyZoomAt(e.clientX, e.clientY, next)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLImageElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    if (zoomRef.current.scale <= 1) return
    gesture.current = {
      mode: 'drag',
      x: e.clientX,
      y: e.clientY,
      zoom: zoomRef.current,
      moved: false,
    }
    setGesturing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLImageElement>) => {
    const g = gesture.current
    const img = imgRef.current
    if (!img || !g || g.mode !== 'drag' || e.pointerType !== 'mouse') return
    if (g.zoom.scale <= 1) return
    setZoom(clampFeedZoom(
      g.zoom.scale,
      g.zoom.x + (e.clientX - g.x),
      g.zoom.y + (e.clientY - g.y),
      img.clientWidth,
      img.clientHeight,
    ))
    g.moved = true
    moved.current = true
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLImageElement>) => {
    if (e.pointerType !== 'mouse') return
    gesture.current = null
    setGesturing(false)
  }

  const original = urls[idx] ?? ''

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 touch-none"
      onClick={(e) => {
        if (moved.current) {
          moved.current = false
          return
        }
        if (e.target === e.currentTarget) onClose()
      }}
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
        ref={imgRef}
        src={lbSrc}
        alt=""
        loading="eager"
        decoding="async"
        draggable={false}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`max-h-[90vh] max-w-[95vw] object-contain select-none touch-none ${
          zoom.scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'
        }`}
        style={{
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
          transition: gesturing ? 'none' : 'transform 0.18s ease-out',
        }}
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
  const frameKey = `${photos[0] ?? ''}|${video?.src ?? ''}`
  const [frame, setFrame] = useState<{ key: string; aspect: number }>({ key: '', aspect: 1 })
  const frameAspect = frame.key === frameKey ? frame.aspect : 1
  const lockFrame = (width: number, height: number) => {
    setFrame((prev) =>
      prev.key === frameKey
        ? prev
        : { key: frameKey, aspect: clampFeedAspect(width, height) },
    )
  }

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
                className="relative w-full min-w-full max-w-full flex-[0_0_100%] overflow-hidden bg-[#111111]"
                style={{ aspectRatio: frameAspect }}
                onClick={() => {
                  if (!dragMoved.current) setLightboxIndex(i)
                }}
              >
                <FeedPhotoFrame
                  url={url}
                  priority={i < priorityCount}
                  onAspect={i === 0 ? lockFrame : undefined}
                />
              </div>
            ))}

            {hasVideo && video ? (
              <div
                key="video"
                className="relative w-full min-w-full max-w-full flex-[0_0_100%] overflow-hidden bg-black"
                style={{ aspectRatio: frameAspect }}
              >
                <FeedInlineVideo
                  src={video.src}
                  videoMp4Url={video.videoMp4Url}
                  poster={video.poster}
                  fill
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
