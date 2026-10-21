'use client'

// Redeploy: Vercel rechazó 330169b porque su autor de git no está en el equipo.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { FeedInlineVideo } from '@/components/feed/FeedInlineVideo'
import {
  CommentsSection,
  HeartIcon,
  prefetchReelComments,
} from '@/components/posts/PostInteractions'
import { feedAvatarUrl } from '@/lib/media-url'
import { sharePost, togglePostLike } from '@/lib/post-engagements'
import {
  closeReels,
  fetchReelBySrc,
  getReelsOpen,
  getSeenReels,
  loadReelsPage,
  markReelSeen,
  resetSeenReels,
  subscribeReels,
  type Reel,
  type ReelsCursor,
} from '@/lib/reels'
import { recycleReels } from '@/lib/reels-order'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

/** Minutos en el MISMO video antes de pausar (costo de Cloudflare Stream). */
const IDLE_PAUSE_MS = 5 * 60 * 1000
/** Descripción visible antes de "ver más" (≈2 líneas). */
const DESC_PREVIEW_CHARS = 80
/** Título y texto del share: el preview lo resuelve la ruta pública del reel. */
const SHARE_TEXT = 'Mira este reel en AirNation'
/** Videos restantes a partir de los cuales se pide la siguiente página. */
const PREFETCH_AT = 3
/** Siguientes que calientan manifiesto + primer segmento, sin reproducirse. */
const PRELOAD_AHEAD = 2

function reelIntent(i: number, index: number): 'play' | 'prime' | 'hold' | null {
  if (i === index) return 'play'
  if (i === index - 1) return 'hold'
  if (i > index && i <= index + PRELOAD_AHEAD) return 'prime'
  return null
}

function preconnectOrigin(src: string) {
  try {
    const origin = new URL(src).origin
    if (document.head.querySelector(`link[data-reel-origin="${origin}"]`)) return
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = origin
    link.crossOrigin = 'anonymous'
    link.dataset.reelOrigin = origin
    document.head.appendChild(link)
  } catch {
    /* url rara: el video igual intenta cargar */
  }
}

/**
 * Modo Reels: pantalla completa vertical con scroll-snap (un video por
 * pantalla). El visible se reproduce; el anterior conserva el buffer y los
 * dos siguientes se calientan. Montado una vez en el layout raíz.
 */
export function ReelsHost() {
  const open = useSyncExternalStore(subscribeReels, getReelsOpen, () => null)
  if (!open) return null
  return <ReelsViewer seedSrc={open.src} />
}

type Me = { id: string; alias: string | null; avatar: string | null }

function ReelScrubber({
  video,
  onActivity,
}: {
  video: HTMLVideoElement | null
  onActivity: () => void
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<number | null>(null)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragRatio, setDragRatio] = useState(0)

  useEffect(() => {
    if (!video) return
    const sync = () => {
      const nextDur = Number.isFinite(video.duration) ? video.duration : 0
      setDur(nextDur)
      if (dragRef.current == null) setTime(video.currentTime || 0)
    }
    video.addEventListener('timeupdate', sync)
    video.addEventListener('durationchange', sync)
    video.addEventListener('loadedmetadata', sync)
    sync()
    return () => {
      video.removeEventListener('timeupdate', sync)
      video.removeEventListener('durationchange', sync)
      video.removeEventListener('loadedmetadata', sync)
    }
  }, [video])

  const ratioFromX = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return 0
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  }

  const applyRatio = (ratio: number) => {
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    const next = ratio * video.duration
    try {
      video.currentTime = next
    } catch {
      /* el browser a veces rechaza el seek antes de tener metadata */
    }
    setTime(next)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!video) return
    event.stopPropagation()
    event.preventDefault()
    barRef.current?.setPointerCapture(event.pointerId)
    const ratio = ratioFromX(event.clientX)
    dragRef.current = ratio
    setDragging(true)
    setDragRatio(ratio)
    applyRatio(ratio)
    onActivity()
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current == null) return
    event.stopPropagation()
    const ratio = ratioFromX(event.clientX)
    dragRef.current = ratio
    setDragRatio(ratio)
    applyRatio(ratio)
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current == null) return
    event.stopPropagation()
    const ratio = dragRef.current
    dragRef.current = null
    setDragging(false)
    applyRatio(ratio)
    onActivity()
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!video || dur <= 0) return
    let next = video.currentTime
    if (event.key === 'ArrowRight') next += 2
    else if (event.key === 'ArrowLeft') next -= 2
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = dur
    else return
    event.preventDefault()
    event.stopPropagation()
    applyRatio(Math.min(1, Math.max(0, next / dur)))
    onActivity()
  }

  const shown = dragging ? dragRatio : dur > 0 ? Math.min(1, time / dur) : 0
  const shownSeconds = Math.round(dragging ? dragRatio * dur : time)

  return (
    <div
      ref={barRef}
      role="slider"
      aria-label="Posición del video"
      aria-valuemin={0}
      aria-valuemax={Math.max(0, Math.round(dur))}
      aria-valuenow={Math.max(0, shownSeconds)}
      aria-orientation="horizontal"
      tabIndex={video ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      onClick={(event) => event.stopPropagation()}
      className="absolute inset-x-0 z-30 flex touch-none items-end bottom-[calc(4rem+max(env(safe-area-inset-bottom),12px))] lg:bottom-[env(safe-area-inset-bottom)]"
      style={{ height: 28 }}
    >
      <div
        className={`w-full bg-white/35 transition-[height] duration-150 ${dragging ? 'h-[5px]' : 'h-[2px]'}`}
      >
        <div className="h-full bg-an-accent" style={{ width: `${shown * 100}%` }} />
      </div>
    </div>
  )
}

function ReelMedia({
  reel,
  intent,
  idle,
  onActivity,
}: {
  reel: Reel
  intent: 'play' | 'prime' | 'hold' | null
  idle: boolean
  onActivity: () => void
}) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  return (
    <>
      {intent ? (
        <FeedInlineVideo
          src={reel.src}
          videoMp4Url={reel.videoMp4Url}
          poster={reel.poster}
          fill
          reels
          intent={intent}
          holdPaused={idle}
          mediaRef={setVideo}
        />
      ) : reel.poster ? (
        <img
          src={reel.poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
      ) : null}
      <ReelScrubber video={video} onActivity={onActivity} />
    </>
  )
}

function ReelsViewer({ seedSrc }: { seedSrc: string }) {
  const pathname = usePathname()
  const [items, setItems] = useState<Reel[]>([])
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [idle, setIdle] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [commentsFor, setCommentsFor] = useState<Reel | null>(null)
  const [sheetDrag, setSheetDrag] = useState(0)
  const [sheetDragging, setSheetDragging] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const sheetDragRef = useRef({ y: 0, t: 0, on: false })
  const [me, setMe] = useState<Me | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<Reel[]>([])
  itemsRef.current = items
  const meRef = useRef<Me | null>(null)
  meRef.current = me
  const cursorRef = useRef<ReelsCursor | null>(null)
  const doneRef = useRef(false)
  const indexRef = useRef(0)
  const loadingRef = useRef(false)
  const pushedRef = useRef(false)
  const pathRef = useRef(pathname)

  // La navbar sigue usable: cambiar de tab cierra Reels y deja ver la ruta.
  useEffect(() => {
    if (pathRef.current === pathname) return
    pathRef.current = pathname
    closeReels()
  }, [pathname])

  /** Cierra respetando el historial: el botón atrás de Android sale de Reels. */
  const dismiss = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false
      window.history.back()
      return
    }
    closeReels()
  }, [])

  // La status bar nativa queda fuera del webview (franja blanca). Al abrir,
  // el video llega hasta arriba y el reloj pasa a blanco sobre negro.
  useEffect(() => {
    const html = document.documentElement
    const prevHtml = html.style.backgroundColor
    const prevBody = document.body.style.backgroundColor
    html.style.backgroundColor = '#000000'
    document.body.style.backgroundColor = '#000000'
    let seq = 0
    const paintStatusBar = async (open: boolean, token: number) => {
      const { isNativeApp } = await import('@/lib/platform')
      if (!isNativeApp() || token !== seq) return
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      if (token !== seq) return
      // setBackgroundColor falla en iOS; no puede impedir el overlay.
      const step = async (task: Promise<void>) => {
        if (token !== seq) return
        await task.catch(() => undefined)
      }
      if (open) {
        await step(StatusBar.setOverlaysWebView({ overlay: true }))
        await step(StatusBar.setStyle({ style: Style.Dark }))
        await step(StatusBar.setBackgroundColor({ color: '#000000' }))
        return
      }
      await step(StatusBar.setStyle({ style: Style.Dark }))
      await step(StatusBar.setBackgroundColor({ color: '#FFFFFF' }))
      await step(StatusBar.setOverlaysWebView({ overlay: false }))
    }
    void paintStatusBar(true, ++seq)
    return () => {
      html.style.backgroundColor = prevHtml
      document.body.style.backgroundColor = prevBody
      void paintStatusBar(false, ++seq)
    }
  }, [])

  // Bloquea el scroll de atrás; Esc y botón atrás cierran.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    const onPop = () => {
      pushedRef.current = false
      closeReels()
    }
    window.history.pushState({ reels: true }, '', window.location.href)
    pushedRef.current = true
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', onPop)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
    }
  }, [dismiss])

  // Primera carga: el video tocado va primero, después la página puntuada.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id ?? null
      if (uid) {
        const { data: profile } = await supabase
          .from('users')
          .select('alias, avatar_url')
          .eq('id', uid)
          .maybeSingle()
        if (!cancelled) {
          setMe({
            id: uid,
            alias: (profile?.alias as string | null) ?? null,
            avatar: (profile?.avatar_url as string | null) ?? null,
          })
        }
      }
      if (cancelled) return
      resetSeenReels()
      const [seed, page] = await Promise.all([
        fetchReelBySrc(seedSrc, uid),
        loadReelsPage(null, uid, new Set(getSeenReels())),
      ])
      if (cancelled) return
      cursorRef.current = page.cursor
      doneRef.current = page.done
      const list = seed
        ? [seed, ...page.reels.filter((r) => r.key !== seed.key)]
        : page.reels
      setItems(list)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [seedSrc])

  const appendRecycle = useCallback(() => {
    const list = itemsRef.current
    const more = recycleReels(list, list[indexRef.current]?.key ?? null)
    if (more.length === 0) return
    setItems((prev) => [...prev, ...more])
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return
    if (doneRef.current) {
      appendRecycle()
      return
    }
    loadingRef.current = true
    try {
      // Páginas enteras ya vistas: sigue hasta encontrar algo o agotar la tabla.
      let guard = 0
      while (guard++ < 40) {
        const cursor = cursorRef.current
        if (!cursor || doneRef.current) break
        const seen = new Set(getSeenReels())
        for (const r of itemsRef.current) seen.add(r.key)
        const page = await loadReelsPage(cursor, meRef.current?.id ?? null, seen)
        const stalled =
          page.cursor.player === cursor.player && page.cursor.team === cursor.team
        cursorRef.current = page.cursor
        doneRef.current = page.done
        if (page.reels.length > 0) {
          setItems((prev) => [...prev, ...page.reels])
          return
        }
        if (page.done || stalled) break
      }
      appendRecycle()
    } finally {
      loadingRef.current = false
    }
  }, [appendRecycle])

  useEffect(() => {
    if (!ready) return
    if (items.length - index <= PREFETCH_AT) void loadMore()
  }, [ready, index, items.length, loadMore])

  indexRef.current = index
  const current = items[index] ?? null
  const currentKey = current?.key
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const armIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_PAUSE_MS)
  }, [])
  /** Seek y cambio de video reinician los 5 min. No rerenderiza si ya estaba activo. */
  const noteActivity = useCallback(() => {
    setIdle(false)
    armIdle()
  }, [armIdle])

  // Cambiar de video: cuenta como visto y reinicia inactividad y "ver más".
  useEffect(() => {
    if (!currentKey) return
    markReelSeen(currentKey)
    setExpanded(false)
    setIdle(false)
    armIdle()
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [currentKey, armIdle])

  // El video tocado ya trae el origen; preconnect antes de que llegue la lista.
  useEffect(() => {
    preconnectOrigin(seedSrc)
    const next = items[0]?.src
    if (next) preconnectOrigin(next)
    void import('hls.js')
  }, [seedSrc, items])

  const onScroll = () => {
    if (commentsFor) return
    const el = scrollerRef.current
    if (!el) return
    const height = el.clientHeight || 1
    const next = Math.max(
      0,
      Math.min(items.length - 1, Math.round(el.scrollTop / height))
    )
    if (next !== index) setIndex(next)
  }

  const toggleLike = async (reel: Reel) => {
    const user = me
    if (!user) return
    const liked = reel.likedByMe
    setItems((prev) =>
      prev.map((r) =>
        r.key === reel.key
          ? {
              ...r,
              likedByMe: !liked,
              likeCount: Math.max(0, r.likeCount + (liked ? -1 : 1)),
            }
          : r
      )
    )
    await togglePostLike({
      postType: reel.postType,
      postId: reel.postId,
      postOwnerId: reel.postOwnerId,
      currentUserId: user.id,
      currentUserAlias: user.alias,
      postHref: reel.postHref,
      liked,
    })
  }

  const share = async (reel: Reel) => {
    // Sin caption: el preview del link ya lo arma /reel/[type]/[id].
    const result = await sharePost(reel.shareUrl, SHARE_TEXT, SHARE_TEXT)
    if (result === 'shared' || result === 'cancelled') return
    setToast(result === 'copied' ? 'Link copiado' : 'No se pudo compartir')
    setTimeout(() => setToast(null), 2000)
  }

  useEffect(() => {
    const uid = me?.id ?? null
    const cur = items[index]
    const nxt = items[index + 1]
    if (cur) prefetchReelComments(cur.postType, cur.postId, uid)
    if (nxt) prefetchReelComments(nxt.postType, nxt.postId, uid)
  }, [index, items, me?.id])

  useEffect(() => {
    setSheetDrag(0)
    setSheetDragging(false)
    if (!commentsFor) {
      setKeyboardInset(0)
      return
    }
    const vv = window.visualViewport
    if (!vv) return
    const sync = () => {
      setKeyboardInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [commentsFor])

  const onSheetPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    sheetDragRef.current = { y: event.clientY, t: Date.now(), on: true }
    setSheetDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onSheetPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!sheetDragRef.current.on) return
    setSheetDrag(Math.max(0, event.clientY - sheetDragRef.current.y))
  }
  const onSheetPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!sheetDragRef.current.on) return
    const dy = Math.max(0, event.clientY - sheetDragRef.current.y)
    const dt = Math.max(1, Date.now() - sheetDragRef.current.t)
    sheetDragRef.current.on = false
    setSheetDragging(false)
    if (dy > 96 || (dy > 36 && dy / dt > 0.65)) setCommentsFor(null)
    else setSheetDrag(0)
  }

  const bumpCommentCount = (key: string, delta: number) =>
    setItems((prev) =>
      prev.map((r) =>
        r.key === key ? { ...r, commentCount: Math.max(0, r.commentCount + delta) } : r
      )
    )

  return (
    <div className="fixed inset-0 z-[300] bg-black">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={
          commentsFor
            ? 'h-full w-full overflow-hidden'
            : 'h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }
      >
        {items.map((reel, i) => (
          <section
            key={`${reel.key}:${i}`}
            className="relative h-full w-full snap-start snap-always overflow-hidden bg-black"
            style={
              commentsFor && i === index
                ? {
                    transform: `translateY(8px) scale(${Math.min(1, 0.34 + sheetDrag / 560)})`,
                    transformOrigin: 'center top',
                    transition: sheetDragging ? 'none' : 'transform 280ms ease',
                    borderRadius: 14,
                  }
                : undefined
            }
          >
            <ReelMedia
              reel={reel}
              intent={reelIntent(i, index)}
              idle={idle}
              onActivity={noteActivity}
            />

            {/* Acciones: like, comentarios, compartir */}
            <div className={`absolute bottom-[calc(4rem+max(env(safe-area-inset-bottom),12px)+2.75rem)] right-[max(0.5rem,env(safe-area-inset-right))] z-20 flex flex-col items-center gap-5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] lg:bottom-[calc(env(safe-area-inset-bottom)+5rem)] ${commentsFor ? 'invisible' : ''}`}>
              <button
                type="button"
                onClick={() => void toggleLike(reel)}
                disabled={!me}
                className="flex flex-col items-center gap-1 disabled:opacity-40"
                aria-label={reel.likedByMe ? 'Quitar me gusta' : 'Me gusta'}
              >
                <HeartIcon filled={reel.likedByMe} size={30} emptyColor="#FFFFFF" />
                <span style={lato} className="text-[11px] font-semibold text-white">
                  {reel.likeCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCommentsFor(reel)}
                className="flex flex-col items-center gap-1"
                aria-label="Comentarios"
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={lato} className="text-[11px] font-semibold text-white">
                  {reel.commentCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => void share(reel)}
                className="flex flex-col items-center gap-1"
                aria-label="Compartir"
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12M8 7l4-4 4 4"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Autor + descripción. inset-x-0 pasa por debajo de la columna de
                acciones (mismo z-20, pero va después en el DOM): sin
                pointer-events-none se tragaba el tap de comentar/compartir. */}
            <div className={`pointer-events-none absolute inset-x-0 bottom-[calc(4rem+max(env(safe-area-inset-bottom),12px))] z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent pb-10 pl-[max(1rem,env(safe-area-inset-left))] pr-16 pt-10 lg:bottom-[env(safe-area-inset-bottom)] ${commentsFor ? 'invisible' : ''}`}>
              <Link
                href={reel.authorHref}
                onClick={() => closeReels()}
                className="pointer-events-auto flex w-fit items-center gap-2"
              >
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/40 bg-black/40">
                  {reel.authorAvatar ? (
                    <img
                      src={feedAvatarUrl(reel.authorAvatar, 72)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      style={jost}
                      className="flex h-full w-full items-center justify-center text-[12px] text-white"
                    >
                      {reel.authorName[0]?.toUpperCase() ?? 'A'}
                    </span>
                  )}
                </span>
                <span style={jost} className="text-[13px] text-white">
                  {reel.authorName}
                </span>
              </Link>

              {reel.content?.trim() ? (
                <div className="pointer-events-auto mt-2 max-h-[40dvh] overflow-y-auto">
                  <p
                    style={lato}
                    className={`whitespace-pre-wrap break-words text-[13px] text-white/95 ${
                      expanded && i === index ? '' : 'line-clamp-2'
                    }`}
                  >
                    {expanded && i === index
                      ? reel.content
                      : reel.content.length > DESC_PREVIEW_CHARS
                        ? `${reel.content.slice(0, DESC_PREVIEW_CHARS)}…`
                        : reel.content}
                  </p>
                  {reel.content.length > DESC_PREVIEW_CHARS ? (
                    <button
                      type="button"
                      onClick={() => setExpanded((v) => !v)}
                      style={lato}
                      className="mt-1 text-[12px] font-semibold text-white/70"
                    >
                      {expanded && i === index ? 'ver menos' : 'ver más'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {/* Cerrar */}
      <button
        type="button"
        onClick={dismiss}
        className={`absolute left-[max(0.5rem,env(safe-area-inset-left))] top-[max(0.5rem,env(safe-area-inset-top))] z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white ${commentsFor ? 'invisible' : ''}`}
        aria-label="Cerrar reels"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <p
        style={lato}
        className={`pointer-events-none absolute left-1/2 top-[max(0.6rem,env(safe-area-inset-top))] z-30 max-w-[58%] -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-center text-[10px] leading-tight text-white/85 ${commentsFor ? 'invisible' : ''}`}
      >
        Beta: esta sección está en pruebas y puede tener errores
      </p>

      {!ready ? (
        <p
          style={lato}
          className="absolute inset-0 z-10 flex items-center justify-center text-[13px] text-white/70"
        >
          Cargando videos…
        </p>
      ) : items.length === 0 ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-8">
          <p style={lato} className="text-center text-[13px] text-white/80">
            No hay videos para mostrar por ahora.
          </p>
          <button
            type="button"
            onClick={dismiss}
            style={jost}
            className="bg-[#CC4B37] px-4 py-2 text-[10px] font-extrabold uppercase text-white"
          >
            Volver
          </button>
        </div>
      ) : null}

      {toast ? (
        <p
          style={lato}
          className="absolute bottom-[calc(4rem+max(env(safe-area-inset-bottom),12px)+3rem)] left-1/2 z-30 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#111111] lg:bottom-[calc(env(safe-area-inset-bottom)+5rem)]"
        >
          {toast}
        </p>
      ) : null}

      {idle ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 px-6">
          <div className="w-full max-w-[280px] rounded-[4px] bg-white p-5 text-center">
            <p style={jost} className="text-[13px] text-[#111111]">
              ¿Sigues ahí?
            </p>
            <p style={lato} className="mt-2 text-[13px] text-[#444444]">
              Pausamos el video para no gastar tus datos.
            </p>
            <button
              type="button"
              onClick={noteActivity}
              style={jost}
              className="mt-4 w-full bg-[#CC4B37] px-4 py-2 text-[10px] font-extrabold uppercase text-white"
            >
              Seguir viendo
            </button>
          </div>
        </div>
      ) : null}

      {commentsFor ? (
        <div className="absolute inset-0 z-40">
          <button
            type="button"
            aria-label="Cerrar comentarios"
            onClick={() => setCommentsFor(null)}
            className="absolute inset-0"
          />
          <div
            className={`absolute inset-x-0 z-10 flex flex-col rounded-t-2xl bg-white ${
              keyboardInset > 0
                ? ''
                : 'bottom-[calc(4rem+max(env(safe-area-inset-bottom),12px))] lg:bottom-[env(safe-area-inset-bottom)]'
            }`}
            style={{
              height: keyboardInset > 0 ? `calc(100% - ${keyboardInset}px - 18%)` : '70%',
              maxHeight: '70%',
              transform: `translateY(${sheetDrag}px)`,
              transition: sheetDragging ? 'none' : 'transform 220ms ease',
              ...(keyboardInset > 0 ? { bottom: keyboardInset } : {}),
            }}
          >
            <div
              className="relative shrink-0 touch-none px-10 pb-2 pt-2"
              onPointerDown={onSheetPointerDown}
              onPointerMove={onSheetPointerMove}
              onPointerUp={onSheetPointerUp}
              onPointerCancel={onSheetPointerUp}
            >
              <div className="mx-auto mt-1 h-1 w-9 rounded-full bg-black/15" />
              <p style={lato} className="pt-2 text-center text-[13px] font-semibold text-[#111111]">
                {(items.find((r) => r.key === commentsFor.key)?.commentCount ??
                  commentsFor.commentCount)}{' '}
                comentarios
              </p>
              <button
                type="button"
                onClick={() => setCommentsFor(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-[#111111]"
                aria-label="Cerrar comentarios"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <CommentsSection
              key={commentsFor.key}
              variant="sheet"
              postType={commentsFor.postType}
              postId={commentsFor.postId}
              postOwnerId={commentsFor.postOwnerId}
              currentUserId={me?.id ?? null}
              currentUserAlias={me?.alias ?? null}
              currentUserAvatar={me?.avatar ?? null}
              postHref={commentsFor.postHref}
              onCommentCountChange={(delta) => bumpCommentCount(commentsFor.key, delta)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
