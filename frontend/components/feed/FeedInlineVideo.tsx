'use client'

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react'

const lato = { fontFamily: "'Lato', sans-serif" } as const

/** Max videos that may hold an active src / download at once. */
const MAX_ACTIVE_VIDEOS = 2

type Slot = {
  id: string
  release: () => void
}

const activeSlots = new Map<string, Slot>()
const waitQueue: Array<{
  id: string
  grant: () => void
}> = []

function requestVideoSlot(id: string): Promise<() => void> {
  return new Promise((resolve) => {
    const tryGrant = () => {
      if (activeSlots.has(id)) {
        resolve(activeSlots.get(id)!.release)
        return
      }
      if (activeSlots.size < MAX_ACTIVE_VIDEOS) {
        const release = () => {
          activeSlots.delete(id)
          const next = waitQueue.shift()
          if (next) next.grant()
        }
        activeSlots.set(id, { id, release })
        resolve(release)
        return
      }
      waitQueue.push({
        id,
        grant: () => {
          if (activeSlots.has(id)) {
            resolve(activeSlots.get(id)!.release)
            return
          }
          const release = () => {
            activeSlots.delete(id)
            const n = waitQueue.shift()
            if (n) n.grant()
          }
          activeSlots.set(id, { id, release })
          resolve(release)
        },
      })
    }
    tryGrant()
  })
}

function cancelQueued(id: string) {
  const idx = waitQueue.findIndex((q) => q.id === id)
  if (idx >= 0) waitQueue.splice(idx, 1)
}

/** In-memory posters so returning to a scrolled video feels instant. */
const posterCache = new Map<string, string>()

function capturePoster(video: HTMLVideoElement, key: string): string | null {
  try {
    if (posterCache.has(key)) return posterCache.get(key)!
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return null
    const canvas = document.createElement('canvas')
    const max = 480
    const scale = Math.min(1, max / Math.max(w, h))
    canvas.width = Math.max(1, Math.round(w * scale))
    canvas.height = Math.max(1, Math.round(h * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const data = canvas.toDataURL('image/jpeg', 0.72)
    if (data && data.length > 32) {
      if (posterCache.size > 40) {
        const first = posterCache.keys().next().value
        if (first) posterCache.delete(first)
      }
      posterCache.set(key, data)
      return data
    }
  } catch {
    /* ignore */
  }
  return null
}

let slotSeq = 0

/** HLS: manifiesto .m3u8 propio o de Cloudflare Stream. */
function isHlsUrl(url: string): boolean {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  if (clean.endsWith('.m3u8')) return true
  return (
    clean.includes('m3u8') &&
    (clean.includes('videodelivery.net') || clean.includes('cloudflarestream.com'))
  )
}

function supportsNativeHls(video: HTMLVideoElement): boolean {
  return Boolean(video.canPlayType('application/vnd.apple.mpegurl'))
}

/**
 * Video estilo reel (9:16 por defecto; 16:9 si horizontal).
 * HLS (Cloudflare Stream) vía nativo en Safari/iOS o hls.js en el resto;
 * MP4 progresivo para los videos legacy de R2.
 * No descarga nada hasta estar cerca del viewport; tope de concurrencia;
 * libera el src al alejarse; cachea poster en memoria.
 */
export function FeedInlineVideo({
  src,
  videoMp4Url,
  poster,
  forceSquare = false,
}: {
  src: string
  videoMp4Url?: string | null
  poster?: string | null
  /** Match photo carousel slides (1:1) instead of tall 9/16. */
  forceSquare?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const slotIdRef = useRef(`fv-${++slotSeq}`)
  const releaseRef = useRef<(() => void) | null>(null)
  const unloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nearRef = useRef(false)
  const visibleRef = useRef(false)
  const hlsRef = useRef<{ destroy: () => void } | null>(null)
  /** URL efectivamente cargada en el <video> (con hls.js el src es un blob). */
  const loadedRef = useRef<string | null>(null)

  const hls = isHlsUrl(src)
  const mediaUrl = hls ? src : videoMp4Url ?? src
  const [videoError, setVideoError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null)
  const [armed, setArmed] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(
    () => poster || posterCache.get(mediaUrl) || null
  )

  // Default square (feed-friendly) until metadata loads; avoid tall 9/16 flash.
  // Portrait → 4/5; landscape → 16/9; forceSquare keeps 1:1 inside carousels.
  const aspectClass = forceSquare
    ? 'aspect-square'
    : isLandscape === true
      ? 'aspect-video'
      : isLandscape === false
        ? 'aspect-[4/5]'
        : 'aspect-square'

  useEffect(() => {
    if (poster) setPosterUrl(poster)
    else if (posterCache.has(mediaUrl)) setPosterUrl(posterCache.get(mediaUrl)!)
  }, [poster, mediaUrl])

  // Retry automático cada 15s hasta 8 veces
  useEffect(() => {
    if (!videoError || retryCount >= 8) return
    const timer = setTimeout(() => {
      setVideoError(false)
      setRetryCount((n) => n + 1)
    }, 15_000)
    return () => clearTimeout(timer)
  }, [videoError, retryCount])

  const detachSrc = () => {
    const el = videoRef.current
    loadedRef.current = null
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    if (!el) return
    el.pause()
    el.removeAttribute('src')
    el.load()
    setArmed(false)
    if (releaseRef.current) {
      releaseRef.current()
      releaseRef.current = null
    }
    cancelQueued(slotIdRef.current)
  }

  const armAndMaybePlay = async () => {
    if (!nearRef.current) return
    const el = videoRef.current
    if (!el) return

    if (!releaseRef.current) {
      const release = await requestVideoSlot(slotIdRef.current)
      if (!nearRef.current) {
        release()
        return
      }
      releaseRef.current = release
    }

    if (loadedRef.current !== mediaUrl) {
      el.preload = 'metadata'
      if (hls && !supportsNativeHls(el)) {
        const { default: Hls } = await import('hls.js')
        if (!nearRef.current) {
          if (releaseRef.current) {
            releaseRef.current()
            releaseRef.current = null
          }
          return
        }
        if (Hls.isSupported()) {
          const instance = new Hls({ capLevelToPlayerSize: true })
          instance.on(Hls.Events.ERROR, (_evt, data) => {
            if (data.fatal) setVideoError(true)
          })
          instance.loadSource(mediaUrl)
          instance.attachMedia(el)
          hlsRef.current = instance
        } else {
          el.src = mediaUrl
        }
      } else {
        el.src = mediaUrl
      }
      loadedRef.current = mediaUrl
      setArmed(true)
    }

    if (visibleRef.current) {
      void el.play().catch(() => {
        /* autoplay bloqueado */
      })
    }
  }

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const nearObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          nearRef.current = entry.isIntersecting
          if (entry.isIntersecting) {
            if (unloadTimer.current) {
              clearTimeout(unloadTimer.current)
              unloadTimer.current = null
            }
            void armAndMaybePlay()
          } else {
            const el = videoRef.current
            el?.pause()
            if (unloadTimer.current) clearTimeout(unloadTimer.current)
            unloadTimer.current = setTimeout(() => {
              if (!nearRef.current) detachSrc()
            }, 800)
          }
        }
      },
      { rootMargin: '220px 0px', threshold: 0.01 }
    )

    const playObs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRef.current = entry.isIntersecting
          const el = videoRef.current
          if (!el) continue
          if (entry.isIntersecting) {
            if (loadedRef.current) {
              void el.play().catch(() => {})
            } else if (nearRef.current) {
              void armAndMaybePlay()
            }
          } else {
            el.pause()
          }
        }
      },
      { threshold: 0.4 }
    )

    nearObs.observe(wrap)
    playObs.observe(wrap)

    return () => {
      nearObs.disconnect()
      playObs.disconnect()
      if (unloadTimer.current) clearTimeout(unloadTimer.current)
      detachSrc()
    }
    // mediaUrl / retry resets observers via remount of video below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaUrl, videoError, retryCount])

  useEffect(() => {
    if (retryCount === 0) return
    if (nearRef.current) void armAndMaybePlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount])

  const togglePlayPause = () => {
    const el = videoRef.current
    if (!el) return
    if (!loadedRef.current) {
      nearRef.current = true
      void armAndMaybePlay()
      return
    }
    if (el.paused) void el.play()
    else el.pause()
  }

  const toggleMute = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsMuted((m) => !m)
  }

  if (videoError) {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center bg-black ${aspectClass}`}
      >
        <p className="mt-3 text-center text-sm text-white" style={lato}>
          {retryCount >= 8 ? 'No se pudo cargar el video.' : 'Procesando video…'}
        </p>
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className={`relative block w-full overflow-hidden bg-black ${aspectClass}`}
    >
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        className="absolute inset-0 h-full w-full cursor-pointer object-cover"
        muted={isMuted}
        playsInline
        loop
        preload="none"
        poster={posterUrl ?? undefined}
        onClick={togglePlayPause}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget
          setIsLandscape(v.videoWidth > v.videoHeight)
          if (!posterUrl) {
            const p = capturePoster(v, mediaUrl)
            if (p) setPosterUrl(p)
          }
        }}
        onLoadedData={(e) => {
          if (!posterUrl) {
            const p = capturePoster(e.currentTarget, mediaUrl)
            if (p) setPosterUrl(p)
          }
          if (visibleRef.current) {
            void e.currentTarget.play().catch(() => {})
          }
        }}
        onError={() => {
          if (!armed) return
          setVideoError(true)
        }}
      />
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
        aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
      >
        {isMuted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M11 5L6 9H4v6h2l5 4V5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M15 9l6 6M21 9l-6 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M11 5L6 9H4v6h2l5 4V5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M15.5 9.5a4 4 0 010 5M17 7a7 7 0 010 10"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
