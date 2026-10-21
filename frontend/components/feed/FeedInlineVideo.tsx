'use client'

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import {
  getFeedAudioMuted,
  setFeedAudioMuted,
  subscribeFeedAudioMuted,
} from '@/lib/feed-audio-preference'
import { FEED_MIN_ASPECT, feedVideoBoxAspect } from '@/lib/media-url'

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

function fullscreenElement(): Element | null {
  return (
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
    null
  )
}

/**
 * Video del feed a ancho completo, sin franjas.
 * La caja usa la proporción real, acotada como las fotos (4:5 … 1.91:1).
 * object-cover llena el marco: un 16:9 se ve a 16:9 y un vertical más alto
 * que 4:5 se recorta un poco arriba y abajo, solo en el feed.
 * Al abrir el video (player nativo en iOS, o el contenedor a pantalla completa)
 * se ve el cuadro entero.
 * HLS (Cloudflare Stream) vía nativo en Safari/iOS o hls.js en el resto;
 * MP4 progresivo para los videos legacy de R2.
 * No descarga nada hasta estar cerca del viewport; tope de concurrencia;
 * libera el src al alejarse; cachea poster en memoria.
 */
export function FeedInlineVideo({
  src,
  videoMp4Url,
  poster,
  fill = false,
}: {
  src: string
  videoMp4Url?: string | null
  poster?: string | null
  /** El padre ya tiene altura (slide del carrusel). */
  fill?: boolean
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
  const [isMuted, setIsMuted] = useState(() => getFeedAudioMuted())
  const [aspect, setAspect] = useState<number | null>(null)
  const [armed, setArmed] = useState(false)
  const [full, setFull] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(
    () => poster || posterCache.get(mediaUrl) || null
  )
  /** true cuando ya medimos el video; el poster no vuelve a pisar la caja. */
  const videoSized = useRef(false)
  const mediaSeen = useRef(mediaUrl)
  if (mediaSeen.current !== mediaUrl) {
    mediaSeen.current = mediaUrl
    videoSized.current = false
    setAspect(null)
  }

  const applyBox = (videoW: number, videoH: number, posterW = 0, posterH = 0, fromVideo = false) => {
    if (fill) return
    if (!fromVideo && videoSized.current) return
    const next = feedVideoBoxAspect(videoW, videoH, posterW, posterH)
    if (next == null) return
    if (fromVideo) videoSized.current = true
    setAspect((prev) => (prev === next ? prev : next))
  }

  // El poster es un frame: fija la caja antes del primer paint si ya está en caché.
  useLayoutEffect(() => {
    if (fill || !posterUrl || videoSized.current) return
    let cancelled = false
    const img = new Image()
    const apply = () => {
      if (cancelled) return
      applyBox(0, 0, img.naturalWidth, img.naturalHeight)
    }
    img.onload = apply
    img.src = posterUrl
    if (img.complete) apply()
    return () => {
      cancelled = true
    }
    // applyBox cierra sobre fill y los refs; posterUrl es la señal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posterUrl, fill])

  useEffect(() => {
    const sync = () => setFull(fullscreenElement() === wrapRef.current)
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  // HLS a veces dispara loadedmetadata en 0×0; resize llega cuando hay cuadro.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const sync = () => applyBox(el.videoWidth, el.videoHeight, 0, 0, true)
    el.addEventListener('resize', sync)
    el.addEventListener('loadedmetadata', sync)
    el.addEventListener('loadeddata', sync)
    return () => {
      el.removeEventListener('resize', sync)
      el.removeEventListener('loadedmetadata', sync)
      el.removeEventListener('loadeddata', sync)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaUrl, fill])

  useEffect(() => {
    if (poster) setPosterUrl(poster)
    else if (posterCache.has(mediaUrl)) setPosterUrl(posterCache.get(mediaUrl)!)
  }, [poster, mediaUrl])

  // Preferencia de mute a nivel de sesión (en memoria; se reinicia en reload).
  useEffect(() => {
    setIsMuted(getFeedAudioMuted())
    return subscribeFeedAudioMuted((muted) => {
      setIsMuted(muted)
      const el = videoRef.current
      if (el) el.muted = muted
    })
  }, [])

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

  /**
   * Best-effort play honoring session mute preference.
   * Autoplay with sound may be blocked until a user gesture: try unmuted play;
   * if play() rejects, fall back to muted for this attempt but keep the session
   * preference unmuted so after the first unmute gesture subsequent plays honor it.
   */
  const playWithAudioPreference = async (el: HTMLVideoElement) => {
    const preferMuted = getFeedAudioMuted()
    el.muted = preferMuted
    setIsMuted(preferMuted)
    try {
      await el.play()
    } catch {
      if (!preferMuted) {
        el.muted = true
        setIsMuted(true) // UI only; session preference stays unmuted
        try {
          await el.play()
        } catch {
          /* autoplay bloqueado incluso muteado */
        }
      }
    }
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
          instance.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
            let w = 0
            let h = 0
            for (const level of data.levels ?? []) {
              const area = (level.width || 0) * (level.height || 0)
              if (area > w * h) {
                w = level.width || 0
                h = level.height || 0
              }
            }
            applyBox(w, h, 0, 0, true)
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
      void playWithAudioPreference(el)
    }
  }

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const wrapIsOpen = () => fullscreenElement() === wrap

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
          } else if (!wrapIsOpen()) {
            const el = videoRef.current
            el?.pause()
            if (unloadTimer.current) clearTimeout(unloadTimer.current)
            unloadTimer.current = setTimeout(() => {
              if (!nearRef.current && fullscreenElement() !== wrap) detachSrc()
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
              void playWithAudioPreference(el)
            } else if (nearRef.current) {
              void armAndMaybePlay()
            }
          } else if (!wrapIsOpen()) {
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

  const openFull = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const el = videoRef.current
    const wrap = wrapRef.current
    if (!el || !wrap) return
    if (!loadedRef.current) {
      nearRef.current = true
      if (hls && supportsNativeHls(el)) {
        el.src = mediaUrl
        loadedRef.current = mediaUrl
        setArmed(true)
      } else {
        void armAndMaybePlay()
      }
    }
    const native = el as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
    const ios =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    // iOS: el player nativo ignora el object-cover del feed y muestra el cuadro entero.
    if (ios && typeof native.webkitEnterFullscreen === 'function') {
      try {
        native.webkitEnterFullscreen()
        return
      } catch {
        /* sigue el fullscreen del contenedor */
      }
    }
    wrap.requestFullscreen?.().catch(() => {})
  }

  const closeFull = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const exit = document.exitFullscreen ?? (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen
    exit?.call(document)
  }

  const togglePlayPause = () => {
    const el = videoRef.current
    if (!el) return
    if (!loadedRef.current) {
      nearRef.current = true
      void armAndMaybePlay()
      return
    }
    if (el.paused) void playWithAudioPreference(el)
    else el.pause()
  }

  const toggleMute = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    const next = !isMuted
    setFeedAudioMuted(next)
    setIsMuted(next)
    const el = videoRef.current
    if (el) {
      el.muted = next
      // Unmute es un gesto de usuario: desbloquea autoplay con sonido.
      if (!next) void el.play().catch(() => {})
    }
  }

  // ponytail: 4:5 hasta que el poster o videoWidth digan la proporción real.
  const boxAspect = aspect ?? FEED_MIN_ASPECT
  const frameClass = full
    ? 'relative flex h-full w-full items-center justify-center bg-black'
    : fill
      ? 'relative block h-full w-full overflow-hidden bg-black'
      : 'relative block w-full overflow-hidden bg-black'
  const frameStyle = fill || full ? undefined : { aspectRatio: boxAspect }

  if (videoError) {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center bg-black ${fill ? 'h-full' : ''}`}
        style={frameStyle}
      >
        <p className="mt-3 text-center text-sm text-white" style={lato}>
          {retryCount >= 8 ? 'No se pudo cargar el video.' : 'Procesando video…'}
        </p>
      </div>
    )
  }

  return (
    <>
      {full && !fill ? (
        <div key="feed-video-spacer" className="w-full bg-black" style={{ aspectRatio: boxAspect }} aria-hidden />
      ) : null}
      <div
        key="feed-video-player"
        ref={wrapRef}
        className={frameClass}
        style={frameStyle}
      >
      <video
        ref={videoRef}
        width="100%"
        height="100%"
        className={
          full
            ? 'h-full w-full max-h-[100dvh] max-w-[100vw] cursor-pointer object-contain'
            : 'absolute inset-0 h-full w-full cursor-pointer object-cover'
        }
        muted={isMuted}
        playsInline
        loop
        preload="none"
        poster={posterUrl ?? undefined}
        onClick={togglePlayPause}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget
          applyBox(v.videoWidth, v.videoHeight, 0, 0, true)
          if (!posterUrl) {
            const p = capturePoster(v, mediaUrl)
            if (p) setPosterUrl(p)
          }
        }}
        onLoadedData={(e) => {
          applyBox(e.currentTarget.videoWidth, e.currentTarget.videoHeight, 0, 0, true)
          if (!posterUrl) {
            const p = capturePoster(e.currentTarget, mediaUrl)
            if (p) setPosterUrl(p)
          }
          if (visibleRef.current) {
            void playWithAudioPreference(e.currentTarget)
          }
        }}
        onError={() => {
          if (!armed) return
          setVideoError(true)
        }}
      />
      {full ? (
        <button
          type="button"
          onClick={closeFull}
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
          aria-label="Cerrar video"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={openFull}
          className="absolute bottom-2 left-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
          aria-label="Ver video completo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={toggleMute}
        className={`absolute z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white ${
          full
            ? 'bottom-[max(0.5rem,env(safe-area-inset-bottom))] right-[max(0.5rem,env(safe-area-inset-right))]'
            : 'bottom-2 right-2'
        }`}
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
    </>
  )
}
