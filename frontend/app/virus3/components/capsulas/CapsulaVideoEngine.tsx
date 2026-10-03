'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import type { default as HlsType } from 'hls.js'
import type { CapsulaItem } from '../../lib/types'
import { isCompleted, type CapsulasProgress } from '../../lib/progreso-capsulas'
import { posterDe } from './poster'
import { getHlsConstructor, isHlsUrl, supportsNativeHls } from './capsulaHls'
import { DEBUG_VACIO, type ReproductorDebugSnapshot } from './reproductorDebug'

export type PlayGestureResult =
  | { ok: true }
  | { ok: false; reason: string; needsTap?: boolean }

type CapsulaVideoEngineApi = {
  videoRef: MutableRefObject<HTMLVideoElement | null>
  hiddenHostRef: MutableRefObject<HTMLDivElement | null>
  muted: boolean
  setMuted: (m: boolean) => void
  needsTapToPlay: boolean
  loadError: boolean
  playFromGesture: (c: CapsulaItem, progreso: CapsulasProgress) => PlayGestureResult
  switchCapsula: (c: CapsulaItem, progreso: CapsulasProgress, play: boolean) => void
  retryLoad: () => void
  tapToPlay: () => PlayGestureResult
  attachToSlot: (slot: HTMLElement | null) => void
  onClose: () => void
  bindVideoEvents: (handlers: {
    onPlay?: () => void
    onPause?: () => void
    onTimeUpdate?: () => void
    onEnded?: () => void
  }) => () => void
  debugSnapshot: ReproductorDebugSnapshot
  currentCapsulaRef: MutableRefObject<CapsulaItem | null>
  progresoRef: MutableRefObject<CapsulasProgress>
}

const CapsulaVideoContext = createContext<CapsulaVideoEngineApi | null>(null)

export function useCapsulaVideoEngine() {
  const ctx = useContext(CapsulaVideoContext)
  if (!ctx) throw new Error('useCapsulaVideoEngine fuera de CapsulaVideoProvider')
  return ctx
}

function playErrorName(err: unknown): string {
  if (err instanceof DOMException) return err.name
  if (err && typeof err === 'object' && 'name' in err) return String((err as { name: unknown }).name)
  return 'Error'
}

export function CapsulaVideoProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hiddenHostRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<HlsType | null>(null)
  const hlsCtorRef = useRef<typeof HlsType | null>(null)
  const loadedUrlRef = useRef<string | null>(null)
  const motorRef = useRef<'nativo' | 'hls.js' | '—'>('—')
  const currentCapsulaRef = useRef<CapsulaItem | null>(null)
  const progresoRef = useRef<CapsulasProgress>({ v: 1, c: [], p: {} })

  const [muted, setMutedState] = useState(false)
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [debug, setDebug] = useState<ReproductorDebugSnapshot>(DEBUG_VACIO)

  const bumpDebug = useCallback((partial: Partial<ReproductorDebugSnapshot>) => {
    setDebug((d) => ({ ...d, ...partial }))
  }, [])

  const syncDebugFromVideo = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const err = v.error
    setDebug((d) => ({
      ...d,
      src: v.currentSrc || v.src || loadedUrlRef.current || '',
      motor: motorRef.current,
      readyState: v.readyState,
      networkState: v.networkState,
      paused: v.paused,
      currentTime: v.currentTime,
      duration: Number.isFinite(v.duration) ? v.duration : 0,
      mediaErrorCode: err ? err.code : null,
      mediaErrorMessage: err ? err.message : '',
    }))
  }, [])

  const destroyHls = useCallback(() => {
    hlsRef.current?.destroy()
    hlsRef.current = null
    motorRef.current = '—'
  }, [])

  const detachSrc = useCallback(() => {
    const v = videoRef.current
    destroyHls()
    loadedUrlRef.current = null
    if (!v) return
    v.pause()
    v.removeAttribute('src')
    v.load()
  }, [destroyHls])

  const applySeek = useCallback((c: CapsulaItem, progreso: CapsulasProgress) => {
    const v = videoRef.current
    if (!v) return
    const pos = progreso.p[c.id] ?? 0
    if (
      pos > 0 &&
      !isCompleted(progreso, c.id) &&
      Number.isFinite(v.duration) &&
      pos < v.duration - 0.5
    ) {
      try {
        v.currentTime = pos
      } catch {
        /* seek */
      }
    }
  }, [])

  const ensureHlsCtor = useCallback(async () => {
    if (hlsCtorRef.current) return hlsCtorRef.current
    const Hls = await getHlsConstructor()
    hlsCtorRef.current = Hls
    return Hls
  }, [])

  const attachHlsIfNeeded = useCallback(
    (v: HTMLVideoElement, url: string) => {
      if (!isHlsUrl(url) || supportsNativeHls(v)) {
        destroyHls()
        if (loadedUrlRef.current !== url) {
          v.src = url
          v.load()
          loadedUrlRef.current = url
        }
        motorRef.current = 'nativo'
        return true
      }
      const Hls = hlsCtorRef.current
      if (!Hls || !Hls.isSupported()) {
        v.src = url
        v.load()
        loadedUrlRef.current = url
        motorRef.current = 'nativo'
        return true
      }
      if (!hlsRef.current) {
        const instance = new Hls({ capLevelToPlayerSize: true })
        instance.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) {
            setLoadError(true)
            bumpDebug({ hlsFatal: data.type || 'fatal', lastMediaEvent: 'hls.error' })
          }
        })
        instance.attachMedia(v)
        hlsRef.current = instance
      }
      if (loadedUrlRef.current !== url) {
        hlsRef.current.loadSource(url)
        loadedUrlRef.current = url
      }
      motorRef.current = 'hls.js'
      return true
    },
    [bumpDebug, destroyHls],
  )

  const prepareSource = useCallback(
    (c: CapsulaItem) => {
      const v = videoRef.current
      if (!v) return
      const url = c.video_url.trim()
      const poster = posterDe(c)
      if (poster) v.poster = poster
      setLoadError(false)
      bumpDebug({ lastMediaEvent: 'prepareSource' })
      if (isHlsUrl(url) && !supportsNativeHls(v) && !hlsCtorRef.current) {
        void ensureHlsCtor().then(() => {
          if (videoRef.current && currentCapsulaRef.current?.id === c.id) {
            attachHlsIfNeeded(videoRef.current, url)
            syncDebugFromVideo()
          }
        })
        return
      }
      attachHlsIfNeeded(v, url)
      syncDebugFromVideo()
    },
    [attachHlsIfNeeded, bumpDebug, ensureHlsCtor, syncDebugFromVideo],
  )

  const runPlay = useCallback((): PlayGestureResult => {
    const v = videoRef.current
    if (!v) return { ok: false, reason: 'NoVideo' }
    v.muted = muted
    const promise = v.play()
    bumpDebug({ lastPlayResult: 'pending' })
    promise
      .then(() => {
        setNeedsTapToPlay(false)
        bumpDebug({ lastPlayResult: 'ok', lastMediaEvent: 'playing' })
        syncDebugFromVideo()
      })
      .catch((err) => {
        const name = playErrorName(err)
        bumpDebug({ lastPlayResult: name, lastMediaEvent: 'play rejected' })
        setNeedsTapToPlay(true)
        syncDebugFromVideo()
      })
    return { ok: true }
  }, [bumpDebug, muted, syncDebugFromVideo])

  const afterMetadata = useCallback(
    (c: CapsulaItem, progreso: CapsulasProgress, play: boolean) => {
      applySeek(c, progreso)
      if (play) runPlay()
    },
    [applySeek, runPlay],
  )

  const playFromGesture = useCallback(
    (c: CapsulaItem, progreso: CapsulasProgress): PlayGestureResult => {
      progresoRef.current = progreso
      currentCapsulaRef.current = c
      const v = videoRef.current
      if (!v) return { ok: false, reason: 'NoVideo' }

      const url = c.video_url.trim()
      const poster = posterDe(c)
      if (poster) v.poster = poster
      setLoadError(false)

      void ensureHlsCtor()

      const onMeta = () => applySeek(c, progreso)

      if (isHlsUrl(url) && !supportsNativeHls(v)) {
        prepareSource(c)
        v.addEventListener('loadedmetadata', onMeta, { once: true })
        return runPlay()
      }

      if (loadedUrlRef.current !== url) {
        destroyHls()
        v.src = url
        loadedUrlRef.current = url
        motorRef.current = 'nativo'
        v.load()
      }
      v.addEventListener('loadedmetadata', onMeta, { once: true })
      bumpDebug({ lastMediaEvent: 'gesture+native' })
      syncDebugFromVideo()
      return runPlay()
    },
    [applySeek, bumpDebug, destroyHls, ensureHlsCtor, prepareSource, runPlay, syncDebugFromVideo],
  )

  const switchCapsula = useCallback(
    (c: CapsulaItem, progreso: CapsulasProgress, play: boolean) => {
      progresoRef.current = progreso
      currentCapsulaRef.current = c
      prepareSource(c)
      const v = videoRef.current
      if (!v) return
      if (v.readyState >= 1 && loadedUrlRef.current === c.video_url.trim()) {
        afterMetadata(c, progreso, play)
        return
      }
      const onMeta = () => afterMetadata(c, progreso, play)
      v.addEventListener('loadedmetadata', onMeta, { once: true })
    },
    [afterMetadata, prepareSource],
  )

  const tapToPlay = useCallback((): PlayGestureResult => {
    setNeedsTapToPlay(false)
    return runPlay()
  }, [runPlay])

  const retryLoad = useCallback(() => {
    const c = currentCapsulaRef.current
    if (!c) return
    setLoadError(false)
    loadedUrlRef.current = null
    detachSrc()
    switchCapsula(c, progresoRef.current, true)
  }, [detachSrc, switchCapsula])

  const attachToSlot = useCallback((slot: HTMLElement | null) => {
    const v = videoRef.current
    const hidden = hiddenHostRef.current
    if (!v || !hidden) return
    if (slot) {
      slot.appendChild(v)
      v.className = 'h-full w-full max-h-full max-w-full object-contain bg-black'
    } else {
      hidden.appendChild(v)
      v.className = 'pointer-events-none absolute h-px w-px opacity-0'
    }
  }, [])

  const onClose = useCallback(() => {
    videoRef.current?.pause()
    detachSrc()
    attachToSlot(null)
    currentCapsulaRef.current = null
    setNeedsTapToPlay(false)
    setLoadError(false)
  }, [attachToSlot, detachSrc])

  const bindVideoEvents = useCallback(
    (handlers: {
      onPlay?: () => void
      onPause?: () => void
      onTimeUpdate?: () => void
      onEnded?: () => void
    }) => {
      const v = videoRef.current
      if (!v) return () => {}
      const log = (name: string) => () => {
        bumpDebug({ lastMediaEvent: name })
        syncDebugFromVideo()
      }
      const wrapped: [string, EventListener][] = [
        ['loadstart', log('loadstart')],
        ['loadedmetadata', log('loadedmetadata')],
        ['loadeddata', log('loadeddata')],
        ['canplay', log('canplay')],
        ['playing', log('playing')],
        ['waiting', log('waiting')],
        ['stalled', log('stalled')],
        [
          'error',
          () => {
            setLoadError(true)
            log('error')()
          },
        ],
      ]
      for (const [ev, fn] of wrapped) v.addEventListener(ev, fn)
      if (handlers.onPlay) v.addEventListener('play', handlers.onPlay)
      if (handlers.onPause) v.addEventListener('pause', handlers.onPause)
      if (handlers.onTimeUpdate) v.addEventListener('timeupdate', handlers.onTimeUpdate)
      if (handlers.onEnded) v.addEventListener('ended', handlers.onEnded)
      return () => {
        for (const [ev, fn] of wrapped) v.removeEventListener(ev, fn)
        if (handlers.onPlay) v.removeEventListener('play', handlers.onPlay)
        if (handlers.onPause) v.removeEventListener('pause', handlers.onPause)
        if (handlers.onTimeUpdate) v.removeEventListener('timeupdate', handlers.onTimeUpdate)
        if (handlers.onEnded) v.removeEventListener('ended', handlers.onEnded)
      }
    },
    [bumpDebug, syncDebugFromVideo],
  )

  useEffect(() => {
    const id = window.setInterval(syncDebugFromVideo, 400)
    return () => window.clearInterval(id)
  }, [syncDebugFromVideo])

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m)
    const v = videoRef.current
    if (v) v.muted = m
  }, [])

  const api = useMemo<CapsulaVideoEngineApi>(
    () => ({
      videoRef,
      hiddenHostRef,
      muted,
      setMuted,
      needsTapToPlay,
      loadError,
      playFromGesture,
      switchCapsula,
      retryLoad,
      tapToPlay,
      attachToSlot,
      onClose,
      bindVideoEvents,
      debugSnapshot: debug,
      currentCapsulaRef,
      progresoRef,
    }),
    [
      attachToSlot,
      bindVideoEvents,
      debug,
      loadError,
      muted,
      needsTapToPlay,
      onClose,
      playFromGesture,
      retryLoad,
      setMuted,
      switchCapsula,
      tapToPlay,
    ],
  )

  return (
    <CapsulaVideoContext.Provider value={api}>
      <div ref={hiddenHostRef} className="pointer-events-none fixed left-0 top-0 z-0 h-0 w-0 overflow-hidden" aria-hidden>
        <video ref={videoRef} playsInline preload="none" muted={muted} />
      </div>
      {children}
    </CapsulaVideoContext.Provider>
  )
}
