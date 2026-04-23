'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { ScrollableTabsNav } from '@/components/ScrollableTabsNav'
import { PhotoGrid } from '@/components/posts/PhotoGrid'
import { PostMenu, PostActions } from '@/components/posts/PostInteractions'
import { supabase } from '@/lib/supabase'
import { uploadFile, uploadVideo } from '@/lib/apiFetch'
import { CropModal } from '@/components/posts/CropModal'
import { MentionInput } from '@/components/posts/MentionInput'
import { VideoTrimmer } from '@/components/posts/VideoTrimmer'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800,
  textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

/** Video estilo reel (9:16 por defecto; 16:9 si el archivo es horizontal). Tap: play/pause. */
export function FeedInlineVideo({
  src,
  videoMp4Url,
}: {
  src: string
  videoMp4Url?: string | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [videoError, setVideoError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isLandscape, setIsLandscape] = useState<boolean | null>(null)

  const aspectClass =
    isLandscape === true ? 'aspect-video' : 'aspect-[9/16]'

  // Retry automático cada 15s hasta 8 veces
  useEffect(() => {
    if (!videoError || retryCount >= 8) return
    const timer = setTimeout(() => {
      setVideoError(false)
      setRetryCount((n) => n + 1)
    }, 15_000)
    return () => clearTimeout(timer)
  }, [videoError, retryCount])

  useEffect(() => {
    if (retryCount === 0) return
    videoRef.current?.load()
  }, [retryCount])

  // Autoplay solo cuando el video entra al viewport
  useEffect(() => {
    const el = videoRef.current
    const wrap = wrapRef.current
    if (!el || !wrap) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void el.play().catch(() => {
              /* bloqueado por browser, ok */
            })
          } else {
            el.pause()
          }
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [videoError])

  const togglePlayPause = () => {
    const el = videoRef.current
    if (!el) return
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
        src={videoMp4Url ?? src}
        width="100%"
        height="100%"
        className="absolute inset-0 h-full w-full cursor-pointer object-cover"
        autoPlay
        muted={isMuted}
        playsInline
        loop
        onClick={togglePlayPause}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget
          setIsLandscape(v.videoWidth > v.videoHeight)
        }}
        onError={() => setVideoError(true)}
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

type Tab = 'feed' | 'eventos' | 'equipos' | 'noticias' | 'videos'

/**
 * Renderiza texto con @alias (incluye espacios en el alias). Si hay `mentionAliasById`,
 * enlaza a `/u/[id]`; si no hay id para ese @, sólo estilo acento.
 */
export function parseContentWithMentions(
  content: string | null | undefined,
  mentionIds: string[] | null | undefined,
  mentionAliasById?: Record<string, string> | null
): ReactNode {
  if (content == null) return null
  const t = String(content)
  if (!t.trim()) return null

  type Pair = { alias: string; id: string }
  const pairs: Pair[] = []
  const seenAlias = new Set<string>()
  if (mentionAliasById && mentionIds?.length) {
    for (const id of mentionIds) {
      const sid = String(id)
      const al = mentionAliasById[sid]?.trim()
      if (!al || seenAlias.has(al.toLowerCase())) continue
      seenAlias.add(al.toLowerCase())
      pairs.push({ alias: al, id: sid })
    }
    pairs.sort((a, b) => b.alias.length - a.alias.length)
  }

  const nodes: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < t.length) {
    const at = t.indexOf('@', i)
    if (at === -1) {
      nodes.push(<span key={key++}>{t.slice(i)}</span>)
      break
    }
    nodes.push(<span key={key++}>{t.slice(i, at)}</span>)
    const afterAt = t.slice(at + 1)
    const lowerAfter = afterAt.toLowerCase()

    let matched: { id: string; len: number } | null = null
    if (pairs.length > 0) {
      for (const { alias, id } of pairs) {
        const low = alias.toLowerCase()
        if (lowerAfter.startsWith(low)) {
          const boundary = afterAt[alias.length]
          if (
            boundary === undefined ||
            /\s/.test(boundary) ||
            boundary === '@' ||
            /^[.,!?;:)\]}¡¿]$/.test(boundary)
          ) {
            matched = { id, len: alias.length }
            break
          }
        }
      }
    }

    if (matched) {
      const mentionText = `@${afterAt.slice(0, matched.len)}`
      nodes.push(
        <Link
          key={key++}
          href={`/u/${matched.id}`}
          className="font-medium text-[#CC4B37] hover:underline"
        >
          {mentionText}
        </Link>
      )
      i = at + 1 + matched.len
      continue
    }

    const loose = /^([\w]+(?:\s+[\w]+)*)/.exec(afterAt)
    if (loose?.[1]) {
      const raw = `@${loose[1]}`
      nodes.push(
        <span key={key++} className="font-medium text-[#CC4B37]">
          {raw}
        </span>
      )
      i = at + 1 + loose[1].length
      continue
    }

    nodes.push(<span key={key++}>@</span>)
    i = at + 1
  }

  return <>{nodes}</>
}

// Tipos de items del feed
type FeedItem =
  | { kind: 'team_post'; id: string; team_id: string; post_owner_id: string | null; content: string | null; mentioned_user_ids?: string[] | null; fotos_urls: string[] | null; created_at: string; team: { nombre: string; slug: string; logo_url: string | null } }
  | {
      kind: 'pinned_post'
      id: string
      post_owner_id: string | null
      user_id: string
      content: string | null
      fotos_urls: string[] | null
      video_url?: string | null
      video_mp4_url?: string | null
      video_duration_s?: number | null
      mentions?: string[]
      mentionAliasById?: Record<string, string>
      replica_id: string | null
      created_at: string
      user: { alias: string | null; nombre: string | null; avatar_url: string | null; is_verified: boolean }
    }
  | {
      kind: 'player_post'
      id: string
      post_owner_id: string | null
      user_id: string
      content: string | null
      fotos_urls: string[] | null
      video_url?: string | null
      video_mp4_url?: string | null
      video_duration_s?: number | null
      mentions?: string[]
      mentionAliasById?: Record<string, string>
      replica_id: string | null
      created_at: string
      user: { alias: string | null; nombre: string | null; avatar_url: string | null; is_verified: boolean }
    }
  | {
      kind: 'field_post'
      id: string
      content: string | null
      fotos_urls: string[] | null
      created_at: string
      created_by: string | null
      post_owner_id: string | null
      field: { nombre: string; slug: string; foto_portada_url: string | null }
    }
  | { kind: 'event'; id: string; title: string; fecha: string; imagen_url: string | null; field_foto: string | null; field_nombre: string | null; field_ciudad: string | null; created_at: string }
  | { kind: 'new_team'; id: string; nombre: string; slug: string; ciudad: string | null; logo_url: string | null; foto_portada_url: string | null; created_at: string }
  | { kind: 'video'; id: string; title: string; youtube_url: string; thumbnail_url: string | null; created_at: string }
  | { kind: 'noticia'; id: string; title: string; slug: string; excerpt: string | null; cover_url: string | null; category: string | null; created_at: string }
  | {
      kind: 'marketplace_listing'
      id: string
      titulo: string
      precio: number | null
      precio_original: number | null
      modalidad: 'fijo' | 'desde'
      supercategoria: string | null
      fotos_urls: string[]
      ciudad: string | null
      estado: string | null
      vendido: boolean
      nuevo_usado: string
      created_at: string
    }

const FEED_SCROLL_Y_KEY = 'feed_scroll_y'
const FEED_ITEMS_CACHE_KEY = 'feed_items_cache'
const FEED_ITEMS_TS_KEY = 'feed_items_ts'
const FEED_CACHE_MAX_MS = 5 * 60 * 1000

type FeedTabSessionPayload = {
  items: FeedItem[]
  cursorPlayerPosts: string | null
  cursorTeamPosts: string | null
  hasMore: boolean
}

export function clearFeedSessionCache() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(FEED_SCROLL_Y_KEY)
    sessionStorage.removeItem(FEED_ITEMS_CACHE_KEY)
    sessionStorage.removeItem(FEED_ITEMS_TS_KEY)
  } catch {
    /* ignore */
  }
}

function getScrollContainer(): HTMLElement | Window {
  return document.getElementById('dashboard-scroll-root') ?? window
}

function getScrollTop(): number {
  const c = document.getElementById('dashboard-scroll-root')
  return c ? c.scrollTop : window.scrollY
}

function readFeedTabSessionCache(): FeedTabSessionPayload | null {
  if (typeof window === 'undefined') return null
  const tsRaw = sessionStorage.getItem(FEED_ITEMS_TS_KEY)
  const cacheRaw = sessionStorage.getItem(FEED_ITEMS_CACHE_KEY)
  if (!cacheRaw || !tsRaw) return null
  const ts = Number(tsRaw)
  if (!Number.isFinite(ts) || Date.now() - ts >= FEED_CACHE_MAX_MS) return null
  try {
    const parsed = JSON.parse(cacheRaw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    if (!Array.isArray(o.items) || o.items.length === 0) return null
    const cp = o.cursorPlayerPosts != null ? String(o.cursorPlayerPosts) : null
    const ct = o.cursorTeamPosts != null ? String(o.cursorTeamPosts) : null
    return {
      items: o.items as FeedItem[],
      cursorPlayerPosts: cp && cp.length > 0 ? cp : null,
      cursorTeamPosts: ct && ct.length > 0 ? ct : null,
      hasMore: typeof o.hasMore === 'boolean' ? o.hasMore : true,
    }
  } catch {
    return null
  }
}

function writeFeedItemsCacheOnly(payload: FeedTabSessionPayload) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(FEED_ITEMS_CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

function touchFeedItemsTimestamp() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(FEED_ITEMS_TS_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

type EventItem = { id: string; title: string; fecha: string; imagen_url: string | null; field_foto: string | null; field_nombre: string | null; field_ciudad: string | null }
type TeamPostItem = { id: string; content: string | null; fotos_urls: string[] | null; created_at: string; team: { nombre: string; slug: string; logo_url: string | null } }
type NoticiaItem = { id: string; title: string; slug: string; excerpt: string | null; cover_url: string | null; category: string | null; created_at: string }
type VideoItem = { id: string; title: string; youtube_url: string; thumbnail_url: string | null; created_at: string }

type FieldPostItem = {
  id: string
  content: string | null
  fotos_urls: string[] | null
  created_at: string
  field: { nombre: string; slug: string; foto_portada_url: string | null }
  created_by: string | null
}

type TeamDirItem = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  estado: string | null
  logo_url: string | null
  foto_portada_url: string | null
  destacado: boolean
}

/** Aproximación en feed (solo campos del select): avatar + portada. */
function mentionIdsFromRow(row: Record<string, unknown>): string[] | undefined {
  const ids = row.mentions
  if (!Array.isArray(ids) || ids.length === 0) return undefined
  return ids.map(String)
}

function rowMentionAliasesFromMap(
  row: Record<string, unknown>,
  aliasByUserId: Map<string, string>
): Record<string, string> | undefined {
  const ids = row.mentions
  if (!Array.isArray(ids) || ids.length === 0) return undefined
  const o: Record<string, string> = {}
  for (const id of ids) {
    const sid = String(id)
    const al = aliasByUserId.get(sid)
    if (al) o[sid] = al
  }
  return Object.keys(o).length > 0 ? o : undefined
}

function mapJoinedUserForPlayerPost(u: Record<string, unknown> | null | undefined): {
  alias: string | null
  nombre: string | null
  avatar_url: string | null
  is_verified: boolean
} {
  if (!u) {
    return { alias: null, nombre: null, avatar_url: null, is_verified: false }
  }
  const avatar_url = (u.avatar_url as string | null) ?? null
  const foto_portada_url = (u.foto_portada_url as string | null) ?? null
  return {
    alias: String(u.alias ?? '') || null,
    nombre: String(u.nombre ?? '') || null,
    avatar_url,
    is_verified: !!avatar_url && !!foto_portada_url,
  }
}

function formatRelativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / (1000 * 60 * 60))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch { return '' }
}

function formatEventDate(iso: string) {
  try {
    const d = new Date(iso)
    const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`
  } catch { return '' }
}

type PostAs =
  | { type: 'player'; id: string; nombre: string; avatar: string | null }
  | { type: 'team'; id: string; nombre: string; avatar: string | null; slug: string }
  | { type: 'field'; id: string; nombre: string; avatar: string | null; slug: string }

export function PostBox({
  userId,
  userAlias,
  userAvatar,
  userTeams,
  userFields,
  onPublished,
}: {
  userId: string
  userAlias: string | null
  userAvatar: string | null
  userTeams: {
    id: string
    nombre: string
    slug: string
    logo_url: string | null
    rol: 'founder' | 'admin'
  }[]
  userFields: { id: string; nombre: string; slug: string; foto_portada_url: string | null }[]
  onPublished: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [postAs, setPostAs] = useState<PostAs>({
    type: 'player',
    id: userId,
    nombre: userAlias || 'Tú',
    avatar: userAvatar,
  })
  const [text, setText] = useState('')
  const [_mentions, setMentions] = useState<string[]>([])
  const [pendingPhotos, setPendingPhotos] = useState<
    { id: string; file: File; preview: string }[]
  >([])
  const [pendingVideo, setPendingVideo] = useState<{
    file: File
    duration: number
    previewUrl: string
  } | null>(null)
  const [showVideoTrimmer, setShowVideoTrimmer] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [cropQueue, setCropQueue] = useState<{ file: File; src: string }[]>([])
  const [currentCrop, setCurrentCrop] = useState<{ file: File; src: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const postAsOptions: PostAs[] = [
    {
      type: 'player',
      id: userId,
      nombre: userAlias || 'Tú',
      avatar: userAvatar,
    },
    ...userTeams.map((t) => ({
      type: 'team' as const,
      id: t.id,
      nombre: t.nombre,
      avatar: t.logo_url,
      slug: t.slug,
    })),
    ...userFields.map((f) => ({
      type: 'field' as const,
      id: f.id,
      nombre: f.nombre,
      avatar: f.foto_portada_url,
      slug: f.slug,
    })),
  ]

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    const queue: { file: File; src: string }[] = []
    for (const file of Array.from(files)) {
      if (pendingPhotos.length + queue.length >= 4) break
      if (!allowed.includes(file.type)) continue
      queue.push({ file, src: URL.createObjectURL(file) })
    }
    if (!queue.length) return
    setCropQueue(queue.slice(1))
    setCurrentCrop(queue[0])
  }

  const handleCropConfirm = (croppedFile: File, preview: string) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    setPendingPhotos((p) => [...p, { id, file: croppedFile, preview }])
    if (currentCrop) URL.revokeObjectURL(currentCrop.src)

    if (cropQueue.length > 0) {
      setCurrentCrop(cropQueue[0])
      setCropQueue((q) => q.slice(1))
    } else {
      setCurrentCrop(null)
    }
  }

  const handleCropCancel = () => {
    if (currentCrop) URL.revokeObjectURL(currentCrop.src)
    for (const q of cropQueue) URL.revokeObjectURL(q.src)
    setCropQueue([])
    setCurrentCrop(null)
  }

  const clearPendingPhotos = () => {
    for (const p of pendingPhotos) URL.revokeObjectURL(p.preview)
    setPendingPhotos([])
  }

  const clearPendingVideo = () => {
    setPendingVideo((prev) => {
      if (prev?.previewUrl) {
        try {
          URL.revokeObjectURL(prev.previewUrl)
        } catch {
          /* noop */
        }
      }
      return null
    })
  }

  const handlePublish = async () => {
    const canPublish =
      text.trim().length > 0 ||
      pendingPhotos.length > 0 ||
      pendingVideo != null
    if (!canPublish || publishing) {
      return
    }
    if (pendingVideo && postAs.type !== 'player') {
      window.alert(
        'El video solo se puede adjuntar cuando publicas como jugador (Tú). Cambia "Publicar como" o quita el video.'
      )
      return
    }
    setPublishing(true)
    try {
      const urls: string[] = []
      for (const p of pendingPhotos) {
        urls.push(await uploadFile(p.file))
      }

      let videoUrl: string | null = null
      let videoMp4Url: string | null = null
      let videoDurationS: number | null = null
      if (pendingVideo) {
        console.log(
          '[PostBox] enviando video, tamaño:',
          pendingVideo.file.size,
          'bytes'
        )
        const v = await uploadVideo(pendingVideo.file)
        videoUrl = v.video_url
        videoMp4Url = v.video_mp4_url ?? null
        videoDurationS = Math.round(v.duration_s)
      }

      const content = text.trim() || null
      const videoFieldsPlayer =
        videoUrl != null && videoDurationS != null
          ? { video_url: videoUrl, video_mp4_url: videoMp4Url, video_duration_s: videoDurationS }
          : {}

      if (postAs.type === 'player') {
        const { error } = await supabase.from('player_posts').insert({
          user_id: userId,
          content,
          fotos_urls: urls,
          ...videoFieldsPlayer,
          ...(_mentions.length > 0 ? { mentions: _mentions } : {}),
          published: true,
        })
        if (error) {
          console.error('[PostBox] player_posts insert', error)
          throw error
        }
      } else if (postAs.type === 'team') {
        const { error } = await supabase.from('team_posts').insert({
          team_id: postAs.id,
          content,
          fotos_urls: urls,
          published: true,
          created_by: userId,
        })
        if (error) {
          console.error('[PostBox] team_posts insert', error)
          throw error
        }
      } else if (postAs.type === 'field') {
        const { error } = await supabase.from('field_posts').insert({
          field_id: postAs.id,
          content,
          fotos_urls: urls,
          created_by: userId,
        })
        if (error) {
          console.error('[PostBox] field_posts insert', error)
          throw error
        }
      }

      setText('')
      setMentions([])
      for (const p of pendingPhotos) URL.revokeObjectURL(p.preview)
      setPendingPhotos([])
      if (pendingVideo?.previewUrl) {
        try {
          URL.revokeObjectURL(pendingVideo.previewUrl)
        } catch {
          /* noop */
        }
      }
      setPendingVideo(null)
      setExpanded(false)
      onPublished()
    } catch (e) {
      console.error('[PostBox] handlePublish', e)
    } finally {
      setPublishing(false)
    }
  }

  if (!expanded) {
    return (
      <div className="mb-4 border border-[#EEEEEE] bg-[#FFFFFF] p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-xs font-bold text-[#CC4B37]"
                style={jost}
              >
                {(userAlias || 'T')[0].toUpperCase()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex-1 bg-[#F4F4F4] px-3 py-2 text-left text-[13px] text-[#AAAAAA]"
            style={lato}
          >
            ¿Qué estás pensando, {userAlias || 'jugador'}?
          </button>
          <button
            type="button"
            onClick={() => {
              setExpanded(true)
            }}
            className="shrink-0 p-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="7"
                stroke="#666666"
                strokeWidth="1.5"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="7"
                stroke="#666666"
                strokeWidth="1.5"
              />
              <rect
                x="3"
                y="14"
                width="7"
                height="7"
                stroke="#666666"
                strokeWidth="1.5"
              />
              <rect
                x="14"
                y="14"
                width="7"
                height="7"
                stroke="#666666"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 overflow-visible border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      {postAsOptions.length > 1 && (
        <div className="mb-3">
          <p
            style={jost}
            className="mb-2 text-[10px] font-extrabold uppercase text-[#999999]"
          >
            Publicar como
          </p>
          <div className="flex flex-wrap gap-2">
            {postAsOptions.map((opt) => (
              <button
                key={`${opt.type}-${opt.id}`}
                type="button"
                onClick={() => setPostAs(opt)}
                className={`flex items-center gap-2 border px-3 py-1.5 text-[11px] transition-colors ${
                  postAs.id === opt.id && postAs.type === opt.type
                    ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]'
                    : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#111111]'
                }`}
                style={jost}
              >
                <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                  {opt.avatar ? (
                    <img
                      src={opt.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-[#CC4B37]">
                      {opt.nombre[0].toUpperCase()}
                    </div>
                  )}
                </div>
                {opt.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      <MentionInput
        value={text}
        onChange={(t, m) => {
          setText(t)
          setMentions(m)
        }}
        placeholder="¿Qué quieres compartir con la comunidad?"
        maxLength={500}
        autoFocus
      />

      {(pendingPhotos.length > 0 || pendingVideo) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {pendingPhotos.map((p) => (
            <div
              key={p.id}
              className="relative h-16 w-16 overflow-hidden bg-[#F4F4F4]"
            >
              <img loading="lazy" decoding="async" src={p.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(p.preview)
                  setPendingPhotos((prev) => prev.filter((x) => x.id !== p.id))
                }}
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-black/50 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          {pendingVideo && (
            <div className="relative h-16 w-16 overflow-hidden bg-[#F4F4F4]">
              <video
                src={pendingVideo.previewUrl}
                muted
                playsInline
                className="h-full w-full object-cover"
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white drop-shadow"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={clearPendingVideo}
                className="absolute right-0 top-0 z-10 flex h-5 w-5 items-center justify-center bg-black/50 text-xs text-white"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pendingPhotos.length >= 4}
            className="p-2 text-[#666666] hover:text-[#111111] disabled:opacity-40"
            aria-label="Añadir fotos"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 7h3l1.5-2h7L17 7h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="13"
                r="3.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowVideoTrimmer(true)}
            className="p-2 text-[#666666] hover:text-[#111111]"
            aria-label="Añadir video"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <rect
                x="2"
                y="5"
                width="15"
                height="14"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M17.5 8.5L22 5.8v12.4l-4.5-2.7V8.5z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setExpanded(false)
              setText('')
              setMentions([])
              clearPendingPhotos()
              clearPendingVideo()
            }}
            style={jost}
            className="border border-[#EEEEEE] px-3 py-2 text-[11px] text-[#666666]"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={
              (text.trim().length === 0 &&
                pendingPhotos.length === 0 &&
                pendingVideo == null) ||
              publishing
            }
            style={jost}
            className="bg-[#CC4B37] px-4 py-2 text-[11px] text-white disabled:opacity-50"
          >
            {publishing ? 'PUBLICANDO...' : 'PUBLICAR'}
          </button>
        </div>
      </div>

      {currentCrop && (
        <CropModal
          imageSrc={currentCrop.src}
          originalFile={currentCrop.file}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {showVideoTrimmer && (
        <div
          className="fixed inset-0 z-[350] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowVideoTrimmer(false)
          }}
        >
          <div
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <VideoTrimmer
              onVideoReady={(file, durationSeconds) => {
                setPendingVideo((prev) => {
                  if (prev?.previewUrl) {
                    try {
                      URL.revokeObjectURL(prev.previewUrl)
                    } catch {
                      /* noop */
                    }
                  }
                  return {
                    file,
                    duration: durationSeconds,
                    previewUrl: URL.createObjectURL(file),
                  }
                })
                setShowVideoTrimmer(false)
              }}
              onCancel={() => setShowVideoTrimmer(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TeamPostCard({ item, currentUserId, currentUserAlias, currentUserAvatar, userTeamRole, onPostDeleted }: {
  item: Extract<FeedItem, { kind: 'team_post' }>
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  userTeamRole: 'founder' | 'admin' | null
  onPostDeleted: (id: string) => void
}) {
  const fotos = (item.fotos_urls ?? []).slice(0, 4)

  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/equipos/${item.team.slug}`}>
          <div className="w-9 h-9 bg-[#F4F4F4] overflow-hidden shrink-0">
            {item.team.logo_url
              ? <img loading="lazy" decoding="async" src={item.team.logo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[#CC4B37] text-sm font-bold" style={jost}>{item.team.nombre[0]}</div>
            }
          </div>
        </Link>
        <div>
          <Link href={`/equipos/${item.team.slug}`}>
            <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111] hover:text-[#CC4B37]">{item.team.nombre}</p>
          </Link>
          <p style={lato} className="text-[11px] text-[#999999]">{formatRelativeTime(item.created_at)}</p>
        </div>
        <div className="ml-auto">
          <PostMenu
            canDelete={userTeamRole === 'founder' || userTeamRole === 'admin'}
            onDelete={async () => {
              const { error } = await supabase
                .from('team_posts')
                .delete()
                .eq('id', item.id)
                .eq('team_id', item.team_id)
              if (!error) onPostDeleted(item.id)
            }}
          />
        </div>
      </div>
      {item.content?.trim() && (
        <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">
          {parseContentWithMentions(item.content, item.mentioned_user_ids ?? null, null)}
        </p>
      )}
      {fotos.length > 0 && <PhotoGrid urls={fotos} />}
      <PostActions
        postType="team"
        postId={item.id}
        postOwnerId={item.post_owner_id}
        currentUserId={currentUserId}
        currentUserAlias={currentUserAlias}
        currentUserAvatar={currentUserAvatar}
        shareUrl={`/equipos/${item.team.slug}`}
        shareTitle={`${item.team.nombre} en AirNation`}
        postHref={`/equipos/${item.team.slug}`}
      />
    </div>
  )
}

function PlayerPostCard({ item, currentUserId, currentUserAlias, currentUserAvatar, isOwner, isAdmin }: {
  item: Extract<FeedItem, { kind: 'player_post' }>
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  isOwner: boolean
  isAdmin: boolean
}) {
  const fotos = (item.fotos_urls ?? []).slice(0, 4)
  const name = item.user.alias?.trim() || item.user.nombre?.trim() || 'Jugador'

  const handleDelete = async () => {
    const { error } = await supabase
      .from('player_posts')
      .delete()
      .eq('id', item.id)
      .eq('user_id', item.user_id)
    if (!error) {
      window.dispatchEvent(new Event('airnation:post-deleted'))
    }
  }

  const handlePin = async () => {
    await supabase
      .from('player_posts')
      .update({ pinned: false })
      .eq('pinned', true)
    await supabase
      .from('player_posts')
      .update({ pinned: true })
      .eq('id', item.id)
    window.dispatchEvent(new Event('airnation:post-deleted'))
  }

  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/u/${item.user_id}`} className="flex min-w-0 flex-1 items-center gap-3 max-w-full">
            <div className="w-9 h-9 bg-[#F4F4F4] overflow-hidden shrink-0 rounded-full">
              {item.user.avatar_url
                ? <img loading="lazy" decoding="async" src={item.user.avatar_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[#CC4B37] text-sm font-bold" style={jost}>{name[0].toUpperCase()}</div>
              }
            </div>
            <span className="flex min-w-0 items-center gap-1">
              <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111] hover:text-[#CC4B37] truncate">{name}</p>
              {item.user.is_verified && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-label="Verificado"
                  className="inline-block shrink-0"
                >
                  <circle cx="7" cy="7" r="7" fill="#CC4B37" />
                  <path
                    d="M3.5 7.5L6 10L10.5 4.5"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </Link>
          <PostMenu
            canDelete={isOwner}
            onDelete={handleDelete}
            canPin={isAdmin}
            isPinned={false}
            onPin={handlePin}
          />
        </div>
        <p style={lato} className="text-[11px] text-[#999999] mt-0.5 ml-12">{formatRelativeTime(item.created_at)}</p>
      </div>
      {item.replica_id ? (
        <>
          {item.content?.trim() && (
            <Link href={`/replicas/${item.replica_id}`} className="block cursor-pointer">
              <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">
                {parseContentWithMentions(
                  item.content,
                  item.mentions ?? null,
                  item.mentionAliasById ?? null
                )}
              </p>
            </Link>
          )}
          {fotos.length > 0 && <PhotoGrid urls={fotos} />}
          {item.video_url ? <FeedInlineVideo src={item.video_url} videoMp4Url={item.video_mp4_url} /> : null}
          <Link
            href={`/replicas/${item.replica_id}`}
            className="block text-[12px] text-[#888888] mt-2 hover:underline"
          >
            Ver réplica
          </Link>
        </>
      ) : (
        <>
          {item.content?.trim() && (
            <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">
              {parseContentWithMentions(
                item.content,
                item.mentions ?? null,
                item.mentionAliasById ?? null
              )}
            </p>
          )}
          {fotos.length > 0 && <PhotoGrid urls={fotos} />}
          {item.video_url ? <FeedInlineVideo src={item.video_url} videoMp4Url={item.video_mp4_url} /> : null}
        </>
      )}
      <PostActions
        postType="player"
        postId={item.id}
        postOwnerId={item.post_owner_id}
        currentUserId={currentUserId}
        currentUserAlias={currentUserAlias}
        currentUserAvatar={currentUserAvatar}
        shareUrl={`/u/${item.user_id}#post-${item.id}`}
        shareTitle={`${item.user.alias ?? item.user.nombre ?? 'Jugador'} en AirNation`}
        postHref={`/u/${item.user_id}`}
      />
    </div>
  )
}

function PinnedPostCard({ item, currentUserId, currentUserAlias, currentUserAvatar, isAdmin }: {
  item: Extract<FeedItem, { kind: 'pinned_post' }>
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  isAdmin: boolean
}) {
  const fotos = (item.fotos_urls ?? []).slice(0, 4)
  const name = item.user.alias?.trim() || item.user.nombre?.trim() || 'Jugador'

  const handleUnpin = async () => {
    await supabase
      .from('player_posts')
      .update({ pinned: false })
      .eq('id', item.id)
    window.dispatchEvent(new Event('airnation:post-deleted'))
  }

  return (
    <div className="border-2 border-[#CC4B37] bg-[#FFFFFF] p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <span
          style={jost}
          className="inline-flex items-center gap-1 rounded-sm bg-[#CC4B37] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          Fijado
        </span>
      </div>
      <div className="mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/u/${item.user_id}`} className="flex min-w-0 flex-1 items-center gap-3 max-w-full">
            <div className="w-9 h-9 bg-[#F4F4F4] overflow-hidden shrink-0 rounded-full">
              {item.user.avatar_url
                ? <img loading="lazy" decoding="async" src={item.user.avatar_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[#CC4B37] text-sm font-bold" style={jost}>{name[0].toUpperCase()}</div>
              }
            </div>
            <span className="flex min-w-0 items-center gap-1">
              <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111] hover:text-[#CC4B37] truncate">{name}</p>
              {item.user.is_verified && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-label="Verificado"
                  className="inline-block shrink-0"
                >
                  <circle cx="7" cy="7" r="7" fill="#CC4B37" />
                  <path
                    d="M3.5 7.5L6 10L10.5 4.5"
                    stroke="#FFFFFF"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </Link>
          <PostMenu
            canPin={isAdmin}
            isPinned={true}
            onPin={handleUnpin}
            canDelete={isAdmin}
            onDelete={handleUnpin}
          />
        </div>
        <p style={lato} className="text-[11px] text-[#999999] mt-0.5 ml-12">{formatRelativeTime(item.created_at)}</p>
      </div>
      {item.replica_id ? (
        <>
          {item.content?.trim() && (
            <Link href={`/replicas/${item.replica_id}`} className="block cursor-pointer">
              <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">
                {parseContentWithMentions(
                  item.content,
                  item.mentions ?? null,
                  item.mentionAliasById ?? null
                )}
              </p>
            </Link>
          )}
          {fotos.length > 0 && <PhotoGrid urls={fotos} />}
          {item.video_url ? <FeedInlineVideo src={item.video_url} videoMp4Url={item.video_mp4_url} /> : null}
          <Link
            href={`/replicas/${item.replica_id}`}
            className="block text-[12px] text-[#888888] mt-2 hover:underline"
          >
            Ver réplica
          </Link>
        </>
      ) : (
        <>
          {item.content?.trim() && (
            <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">
              {parseContentWithMentions(
                item.content,
                item.mentions ?? null,
                item.mentionAliasById ?? null
              )}
            </p>
          )}
          {fotos.length > 0 && <PhotoGrid urls={fotos} />}
          {item.video_url ? <FeedInlineVideo src={item.video_url} videoMp4Url={item.video_mp4_url} /> : null}
        </>
      )}
      <PostActions
        postType="player"
        postId={item.id}
        postOwnerId={item.post_owner_id}
        currentUserId={currentUserId}
        currentUserAlias={currentUserAlias}
        currentUserAvatar={currentUserAvatar}
        shareUrl={`/u/${item.user_id}#post-${item.id}`}
        shareTitle={`${item.user.alias ?? item.user.nombre ?? 'Jugador'} en AirNation`}
        postHref={`/u/${item.user_id}`}
      />
    </div>
  )
}

function FieldPostCard({
  item,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
  onPostDeleted,
}: {
  item: Extract<FeedItem, { kind: 'field_post' }>
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  onPostDeleted: (id: string) => void
}) {
  const fotos = (item.fotos_urls ?? []).slice(0, 4)
  const initial = (item.field.nombre.trim()[0] || '?').toUpperCase()
  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="mb-3 flex items-center gap-3">
        <Link href={`/campos/${item.field.slug}`}>
          <div className="h-9 w-9 shrink-0 overflow-hidden bg-[#F4F4F4]">
            {item.field.foto_portada_url ? (
              <img
                src={item.field.foto_portada_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm font-bold text-[#CC4B37]"
                style={jost}
              >
                {initial}
              </div>
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/campos/${item.field.slug}`}>
            <p
              style={jost}
              className="text-[12px] font-extrabold uppercase text-[#111111] hover:text-[#CC4B37]"
            >
              {item.field.nombre}
            </p>
          </Link>
          <p style={lato} className="text-[11px] text-[#999999]">
            {formatRelativeTime(item.created_at)}
          </p>
        </div>
        <PostMenu
          canDelete={currentUserId === item.created_by}
          onDelete={async () => {
            const { error } = await supabase
              .from('field_posts')
              .delete()
              .eq('id', item.id)
            if (!error) onPostDeleted(item.id)
          }}
        />
      </div>
      {item.content?.trim() && (
        <p
          style={lato}
          className="mb-3 text-[14px] leading-relaxed text-[#111111]"
        >
          {item.content}
        </p>
      )}
      {fotos.length > 0 && <PhotoGrid urls={fotos} />}
      <PostActions
        postType="field"
        postId={item.id}
        postOwnerId={item.post_owner_id}
        postHref={`/campos/${item.field.slug}`}
        currentUserId={currentUserId}
        currentUserAlias={currentUserAlias}
        currentUserAvatar={currentUserAvatar}
        shareUrl={`/campos/${item.field.slug}`}
        shareTitle={`${item.field.nombre} en AirNation`}
      />
    </div>
  )
}

function EventCard({
  item,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
}: {
  item: Extract<FeedItem, { kind: 'event' }>
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
}) {
  const sub = [item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ')
  const imagenFinal = item.imagen_url?.trim() || item.field_foto?.trim() || null
  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
      <Link href={`/eventos/${item.id}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
          {imagenFinal
            ? <img loading="lazy" decoding="async" src={imagenFinal} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="16" rx="1.5" stroke="#444" strokeWidth="1.4"/>
                  <path d="M3 9h18M8 5V3M16 5V3" stroke="#444" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37]">
              {formatEventDate(item.fecha)}
            </p>
            <h3 style={jost} className="mt-0.5 text-[14px] font-extrabold uppercase leading-snug text-white line-clamp-2">
              {item.title}
            </h3>
            {sub && (
              <p style={lato} className="mt-1 text-[11px] text-white/70 truncate">{sub}</p>
            )}
          </div>
        </div>
      </Link>
      <div className="px-3">
        <PostActions
          postType="event"
          postId={item.id}
          postOwnerId={null}
          currentUserId={currentUserId}
          currentUserAlias={currentUserAlias}
          currentUserAvatar={currentUserAvatar}
          shareUrl={`/eventos/${item.id}`}
          shareTitle={item.title}
          postHref={`/eventos/${item.id}`}
        />
      </div>
    </div>
  )
}

function NewTeamCard({
  item,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
}: {
  item: Extract<FeedItem, { kind: 'new_team' }>
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
}) {
  const initial = (item.nombre.trim()[0] || '?').toUpperCase()
  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
      <Link href={`/equipos/${encodeURIComponent(item.slug)}`} className="block">
        {item.foto_portada_url && (
          <div className="relative h-[140px] w-full overflow-hidden bg-[#111111]">
            <img loading="lazy" decoding="async" src={item.foto_portada_url} alt="" className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        <div className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 shrink-0 overflow-hidden bg-[#F4F4F4] border border-[#EEEEEE]">
            {item.logo_url
              ? <img loading="lazy" decoding="async" src={item.logo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[#CC4B37] text-lg font-bold" style={jost}>{initial}</div>
            }
          </div>
          <div className="min-w-0 flex-1">
            <p style={lato} className="text-[10px] text-[#999999] mb-0.5 uppercase tracking-wide">Nuevo equipo</p>
            <h3 style={jost} className="text-[13px] font-extrabold uppercase text-[#111111] line-clamp-1">{item.nombre}</h3>
            {item.ciudad && <p style={lato} className="text-[11px] text-[#666666]">{item.ciudad}</p>}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#CCCCCC]">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </Link>
      <div className="px-3">
        <PostActions
          postType="new_team"
          postId={item.id}
          postOwnerId={null}
          currentUserId={currentUserId}
          currentUserAlias={currentUserAlias}
          currentUserAvatar={currentUserAvatar}
          shareUrl={`/equipos/${encodeURIComponent(item.slug)}`}
          shareTitle={`${item.nombre} en AirNation`}
          postHref={`/equipos/${encodeURIComponent(item.slug)}`}
        />
      </div>
    </div>
  )
}

function VideoCard({
  item,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
}: {
  item: Extract<FeedItem, { kind: 'video' }>
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
}) {
  const [playing, setPlaying] = useState(false)
  const videoId = item.youtube_url?.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )?.[1]
  const thumb = item.thumbnail_url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)

  if (!videoId) return null

  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
      <div className="relative aspect-video w-full bg-[#111111]">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="w-full h-full relative"
          >
            {thumb && (
              <img loading="lazy" decoding="async" src={thumb} alt="" className="w-full h-full object-cover opacity-90"/>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-[#CC4B37] flex items-center justify-center hover:opacity-90 transition-opacity">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden>
                  <path d="M8 5.14v14l11-7-11-7z"/>
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="p-3">
        <p style={lato} className="text-[11px] text-[#999999] mb-1">Video</p>
        <h3 style={jost} className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">
          {item.title}
        </h3>
      </div>
      <div className="px-3">
        <PostActions
          postType="video"
          postId={item.id}
          postOwnerId={null}
          currentUserId={currentUserId}
          currentUserAlias={currentUserAlias}
          currentUserAvatar={currentUserAvatar}
          shareUrl={`https://youtu.be/${videoId}`}
          shareTitle={item.title}
          postHref={`https://youtu.be/${videoId}`}
        />
      </div>
    </div>
  )
}

function NoticiaFeedCard({
  item,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
}: {
  item: Extract<FeedItem, { kind: 'noticia' }>
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
}) {
  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
      <Link href={`/blog/${item.slug}`} className="block">
        {item.cover_url && (
          <div className="aspect-[16/7] w-full overflow-hidden bg-[#F4F4F4]">
            <img loading="lazy" decoding="async" src={item.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-3">
          {item.category && (
            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37] mb-1">
              {item.category}
            </p>
          )}
          <h3 style={jost} className="text-[13px] font-extrabold uppercase leading-snug text-[#111111] line-clamp-2">
            {item.title}
          </h3>
          {item.excerpt && (
            <p style={lato} className="mt-1 text-[12px] text-[#666666] line-clamp-2">
              {item.excerpt}
            </p>
          )}
          <p style={jost} className="mt-2 text-[10px] font-extrabold uppercase text-[#CC4B37]">
            LEER MÁS →
          </p>
        </div>
      </Link>
      <div className="px-3">
        <PostActions
          postType="noticia"
          postId={item.id}
          postOwnerId={null}
          currentUserId={currentUserId}
          currentUserAlias={currentUserAlias}
          currentUserAvatar={currentUserAvatar}
          shareUrl={`/blog/${item.slug}`}
          shareTitle={item.title}
          postHref={`/blog/${item.slug}`}
        />
      </div>
    </div>
  )
}

function MarketplaceFeedCard({ item }: { item: Extract<FeedItem, { kind: 'marketplace_listing' }> }) {
  const foto = item.fotos_urls?.[0] ?? null
  const ubicacion = [item.ciudad, item.estado].filter(Boolean).join(', ')
  const sublabel = item.supercategoria?.trim() || 'Marketplace'

  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4]"
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 10V20a1 1 0 001 1h14a1 1 0 001-1V10M4 10h16M4 10L5.5 5h13L20 10M9 14v3M15 14v3"
              stroke="#CC4B37"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p style={jost} className="text-[11px] font-extrabold uppercase text-[#CC4B37]">
            En venta
          </p>
          <p style={lato} className="text-[11px] text-[#999999]">
            {sublabel}
          </p>
        </div>
      </div>

      <Link href={`/marketplace/${item.id}`} className="mt-3 block w-full">
        <div
          className="relative w-full overflow-hidden bg-[#F0F2F5]"
          style={{ aspectRatio: '4/3' }}
        >
          {foto ? (
            <img loading="lazy" decoding="async" src={foto} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h4l2-2h4l2 2h4v12H4V7z"
                  stroke="#CCCCCC"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="13" r="3" stroke="#CCCCCC" strokeWidth="1.4" />
              </svg>
            </div>
          )}
        </div>

        <div className="pt-3">
          <p style={lato} className="line-clamp-2 text-[15px] font-medium leading-snug text-[#111111]">
            {item.titulo}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            {item.precio_original != null ? (
              <span style={lato} className="text-[13px] text-[#999999] line-through">
                ${item.precio_original.toLocaleString('es-MX')}
              </span>
            ) : null}
            <p style={jost} className="text-[16px] font-extrabold text-[#111111]">
              {item.modalidad === 'desde' ? (
                <span style={lato} className="mr-1 text-[13px] font-normal normal-case text-[#999999]">
                  Desde
                </span>
              ) : null}
              ${item.precio?.toLocaleString('es-MX') ?? '—'}
            </p>
          </div>
          {ubicacion ? (
            <p style={lato} className="mt-1 text-[11px] text-[#999999]">
              {ubicacion}
            </p>
          ) : null}
        </div>
      </Link>

      <div className="mt-3 flex items-center justify-between border-t border-[#EEEEEE] pt-3">
        <Link
          href={`/marketplace/${item.id}`}
          style={jost}
          className="text-[11px] font-extrabold uppercase text-[#CC4B37]"
        >
          Ver publicación →
        </Link>
        <Link
          href="/dashboard/arsenal?tab=explorar"
          style={jost}
          className="text-[11px] font-extrabold uppercase text-[#999999]"
        >
          Explorar más en venta →
        </Link>
      </div>
    </div>
  )
}

// ─── FEED TAB ───
/** Recarga con `key` desde el padre tras publicar. Paginación / scroll infinito: ampliar límites y cursores aquí. */
function FeedTab({
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
  userTeams,
  isAdmin,
}: {
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  userTeams: { id: string; slug: string; rol: 'founder' | 'admin' }[]
  isAdmin: boolean
}) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursorPlayerPosts, setCursorPlayerPosts] = useState<string | null>(null)
  const [cursorTeamPosts, setCursorTeamPosts] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingMoreRef = useRef(false)

  const load = useCallback(async () => {
      clearFeedSessionCache()
      setItems([])
      setHasMore(true)
      setCursorPlayerPosts(null)
      setCursorTeamPosts(null)
      loadingMoreRef.current = false
      setLoadingMore(false)
      setLoading(true)
      try {
      const [
        teamPostsRes,
        pinnedPlayerPostRes,
        playerPostsRes,
        fieldPostsRes,
        eventsRes,
        teamsRes,
        videosRes,
        noticiasRes,
        marketplaceListingsRes,
      ] = await Promise.all([
        supabase.from('team_posts')
          .select('id, team_id, content, fotos_urls, created_at, created_by, teams(nombre, slug, logo_url)')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('player_posts')
          .select(
            'id, user_id, content, fotos_urls, video_url, video_duration_s, replica_id, mentions, created_at, pinned, users(alias, nombre, avatar_url, foto_portada_url, team_id)'
          )
          .eq('published', true)
          .eq('pinned', true)
          .limit(1),
        supabase.from('player_posts')
          .select(
            'id, user_id, content, fotos_urls, video_url, video_duration_s, replica_id, mentions, created_at, pinned, users(alias, nombre, avatar_url, foto_portada_url, team_id)'
          )
          .eq('published', true)
          .eq('pinned', false)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('field_posts')
          .select(
            'id, content, fotos_urls, created_at, created_by, fields(nombre, slug, foto_portada_url)'
          )
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('events')
          .select('id, title, fecha, imagen_url, created_at, fields(nombre, ciudad, foto_portada_url)')
          .eq('published', true)
          .eq('status', 'publicado')
          .gte('fecha', new Date().toISOString())
          .order('fecha', { ascending: true })
          .limit(5),
        supabase.from('teams')
          .select('id, nombre, slug, ciudad, logo_url, foto_portada_url, created_at')
          .eq('status', 'activo')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('videos')
          .select('id, title, youtube_url, thumbnail_url, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('posts')
          .select('id, title, slug, excerpt, cover_url, category, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('marketplace')
          .select(
            'id, titulo, precio, precio_original, modalidad, supercategoria, fotos_urls, ciudad, estado, vendido, nuevo_usado, created_at'
          )
          .eq('status', 'activo')
          .eq('vendido', false)
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (pinnedPlayerPostRes.error) {
        console.error(
          '[FeedTab] pinned player_posts:',
          pinnedPlayerPostRes.error.message,
          pinnedPlayerPostRes.error
        )
      }
      if (playerPostsRes.error) {
        console.error(
          '[FeedTab] player_posts:',
          playerPostsRes.error.message,
          playerPostsRes.error
        )
      }

      const collectRows = [
        ...(pinnedPlayerPostRes.data ?? []),
        ...(playerPostsRes.data ?? []),
      ] as Record<string, unknown>[]
      const mentionIdSet = new Set<string>()
      for (const r of collectRows) {
        const m = r.mentions
        if (Array.isArray(m)) {
          for (const id of m) mentionIdSet.add(String(id))
        }
      }
      let mentionAliasByUserId = new Map<string, string>()
      if (mentionIdSet.size > 0) {
        try {
          const { data: mu, error: muErr } = await supabase
            .from('users')
            .select('id, alias')
            .in('id', Array.from(mentionIdSet))
          if (muErr) {
            console.error('[FeedTab] users (mention aliases):', muErr.message, muErr)
          }
          for (const u of mu ?? []) {
            const ur = u as { id: string; alias: string | null }
            if (ur.alias?.trim()) mentionAliasByUserId.set(ur.id, ur.alias.trim())
          }
        } catch (e) {
          console.error('[FeedTab] mention alias fetch failed', e)
        }
      }

      const feedItems: FeedItem[] = []

      for (const row of teamPostsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const t = Array.isArray(r.teams) ? r.teams[0] : r.teams
        if (!t) continue
        feedItems.push({
          kind: 'team_post',
          id: String(r.id),
          team_id: String(r.team_id ?? ''),
          post_owner_id: r.created_by ? String(r.created_by) : null,
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : null,
          created_at: String(r.created_at),
          team: { nombre: String((t as Record<string, unknown>).nombre ?? ''), slug: String((t as Record<string, unknown>).slug ?? ''), logo_url: (t as Record<string, unknown>).logo_url as string | null },
        })
      }

      for (const row of pinnedPlayerPostRes.data ?? []) {
        const r = row as Record<string, unknown>
        const u = Array.isArray(r.users) ? r.users[0] : r.users
        feedItems.push({
          kind: 'pinned_post',
          id: String(r.id),
          post_owner_id: String(r.user_id ?? ''),
          user_id: String(r.user_id ?? ''),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : null,
          video_url: (r.video_url as string | null) ?? null,
          video_mp4_url: (r.video_mp4_url as string | null) ?? null,
          video_duration_s:
            r.video_duration_s != null && Number.isFinite(Number(r.video_duration_s))
              ? Number(r.video_duration_s)
              : undefined,
          mentions: mentionIdsFromRow(r),
          mentionAliasById: rowMentionAliasesFromMap(r, mentionAliasByUserId),
          replica_id: r.replica_id ? String(r.replica_id) : null,
          created_at: String(r.created_at),
          user: mapJoinedUserForPlayerPost(
            u ? (u as Record<string, unknown>) : null
          ),
        })
      }

      for (const row of playerPostsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const u = Array.isArray(r.users) ? r.users[0] : r.users
        feedItems.push({
          kind: 'player_post',
          id: String(r.id),
          post_owner_id: String(r.user_id ?? ''),
          user_id: String(r.user_id ?? ''),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : null,
          video_url: (r.video_url as string | null) ?? null,
          video_mp4_url: (r.video_mp4_url as string | null) ?? null,
          video_duration_s:
            r.video_duration_s != null && Number.isFinite(Number(r.video_duration_s))
              ? Number(r.video_duration_s)
              : undefined,
          mentions: mentionIdsFromRow(r),
          mentionAliasById: rowMentionAliasesFromMap(r, mentionAliasByUserId),
          replica_id: r.replica_id ? String(r.replica_id) : null,
          created_at: String(r.created_at),
          user: mapJoinedUserForPlayerPost(
            u ? (u as Record<string, unknown>) : null
          ),
        })
      }

      for (const row of fieldPostsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const f = Array.isArray(r.fields) ? r.fields[0] : r.fields
        feedItems.push({
          kind: 'field_post',
          id: String(r.id),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : null,
          created_at: String(r.created_at),
          created_by: r.created_by ? String(r.created_by) : null,
          post_owner_id: r.created_by ? String(r.created_by) : null,
          field: {
            nombre: f ? String((f as Record<string, unknown>).nombre ?? '') : '',
            slug: f ? String((f as Record<string, unknown>).slug ?? '') : '',
            foto_portada_url: f
              ? ((f as Record<string, unknown>).foto_portada_url as string | null)
              : null,
          },
        })
      }

      for (const row of eventsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const f = Array.isArray(r.fields) ? r.fields[0] : r.fields
        feedItems.push({
          kind: 'event',
          id: String(r.id),
          title: String(r.title ?? ''),
          fecha: String(r.fecha ?? ''),
          imagen_url: (r.imagen_url as string | null) ?? null,
          field_foto: f ? (f as Record<string, unknown>).foto_portada_url as string | null : null,
          field_nombre: f ? String((f as Record<string, unknown>).nombre ?? '') || null : null,
          field_ciudad: f ? String((f as Record<string, unknown>).ciudad ?? '') || null : null,
          created_at: String(r.created_at),
        })
      }

      for (const row of teamsRes.data ?? []) {
        const r = row as Record<string, unknown>
        feedItems.push({
          kind: 'new_team',
          id: String(r.id),
          nombre: String(r.nombre ?? ''),
          slug: String(r.slug ?? ''),
          ciudad: (r.ciudad as string | null) ?? null,
          logo_url: (r.logo_url as string | null) ?? null,
          foto_portada_url: (r.foto_portada_url as string | null) ?? null,
          created_at: String(r.created_at),
        })
      }

      for (const row of videosRes.data ?? []) {
        const r = row as Record<string, unknown>
        if (!r.youtube_url) continue
        feedItems.push({
          kind: 'video',
          id: String(r.id),
          title: String(r.title ?? ''),
          youtube_url: String(r.youtube_url),
          thumbnail_url: (r.thumbnail_url as string | null) ?? null,
          created_at: String(r.created_at),
        })
      }

      for (const row of noticiasRes.data ?? []) {
        const r = row as Record<string, unknown>
        feedItems.push({
          kind: 'noticia',
          id: String(r.id),
          title: String(r.title ?? ''),
          slug: String(r.slug ?? ''),
          excerpt: (r.excerpt as string | null) ?? null,
          cover_url: (r.cover_url as string | null) ?? null,
          category: (r.category as string | null) ?? null,
          created_at: String(r.created_at),
        })
      }

      for (const row of marketplaceListingsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const modalidadRaw = r.modalidad
        const modalidad: 'fijo' | 'desde' = modalidadRaw === 'desde' ? 'desde' : 'fijo'
        feedItems.push({
          kind: 'marketplace_listing',
          id: String(r.id ?? ''),
          titulo: String(r.titulo ?? ''),
          precio: r.precio != null ? Number(r.precio) : null,
          precio_original: r.precio_original != null ? Number(r.precio_original) : null,
          modalidad,
          supercategoria: r.supercategoria != null ? String(r.supercategoria) : null,
          fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : [],
          ciudad: r.ciudad != null ? String(r.ciudad) : null,
          estado: r.estado != null ? String(r.estado) : null,
          vendido: Boolean(r.vendido),
          nuevo_usado: String(r.nuevo_usado ?? 'usado'),
          created_at: String(r.created_at ?? ''),
        })
      }

      const pinnedRows = feedItems.filter(
        (i): i is Extract<FeedItem, { kind: 'pinned_post' }> => i.kind === 'pinned_post'
      )
      const rest = feedItems.filter((i) => i.kind !== 'pinned_post')
      rest.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setItems([...pinnedRows, ...rest])

      const teamData = teamPostsRes.data ?? []
      const playerData = playerPostsRes.data ?? []
      if (teamData.length > 0) {
        const last = teamData[teamData.length - 1] as Record<string, unknown>
        setCursorTeamPosts(String(last.created_at))
      } else {
        setCursorTeamPosts(null)
      }
      if (playerData.length > 0) {
        const last = playerData[playerData.length - 1] as Record<string, unknown>
        setCursorPlayerPosts(String(last.created_at))
      } else {
        setCursorPlayerPosts(null)
      }

      touchFeedItemsTimestamp()
      } catch (e) {
        console.error('[FeedTab] load failed', e)
      } finally {
        setLoading(false)
      }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || loading) return
    if (!cursorPlayerPosts && !cursorTeamPosts) {
      setHasMore(false)
      return
    }

    loadingMoreRef.current = true
    setLoadingMore(true)
    let didAppendFromServer = false
    try {
      const [teamRes, playerRes] = await Promise.all([
        cursorTeamPosts
          ? supabase
              .from('team_posts')
              .select('id, team_id, content, fotos_urls, created_at, created_by, teams(nombre, slug, logo_url)')
              .eq('published', true)
              .lt('created_at', cursorTeamPosts)
              .order('created_at', { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [] as Record<string, unknown>[] }),
        cursorPlayerPosts
          ? supabase
              .from('player_posts')
              .select(
                'id, user_id, content, fotos_urls, video_url, video_duration_s, replica_id, mentions, created_at, pinned, users(alias, nombre, avatar_url, foto_portada_url, team_id)'
              )
              .eq('published', true)
              .eq('pinned', false)
              .lt('created_at', cursorPlayerPosts)
              .order('created_at', { ascending: false })
              .limit(50)
          : Promise.resolve({ data: [] as Record<string, unknown>[] }),
      ])

      const teamRows = teamRes.data ?? []
      const playerRows = playerRes.data ?? []

      const loadMoreMentionIds = new Set<string>()
      for (const r of playerRows) {
        const m = (r as Record<string, unknown>).mentions
        if (Array.isArray(m)) {
          for (const id of m) loadMoreMentionIds.add(String(id))
        }
      }
      let loadMoreAliasByUserId = new Map<string, string>()
      if (loadMoreMentionIds.size > 0) {
        try {
          const { data: mu, error: muErr } = await supabase
            .from('users')
            .select('id, alias')
            .in('id', Array.from(loadMoreMentionIds))
          if (muErr) {
            console.error('[FeedTab loadMore] users (mention aliases):', muErr.message, muErr)
          }
          for (const u of mu ?? []) {
            const ur = u as { id: string; alias: string | null }
            if (ur.alias?.trim()) loadMoreAliasByUserId.set(ur.id, ur.alias.trim())
          }
        } catch (e) {
          console.error('[FeedTab loadMore] mention alias fetch failed', e)
        }
      }

      if (teamRows.length === 0 && playerRows.length === 0) {
        setHasMore(false)
        return
      }

      didAppendFromServer = true
      const newItems: FeedItem[] = []

      for (const row of teamRows) {
        const r = row as Record<string, unknown>
        const t = Array.isArray(r.teams) ? r.teams[0] : r.teams
        if (!t) continue
        newItems.push({
          kind: 'team_post',
          id: String(r.id),
          team_id: String(r.team_id ?? ''),
          post_owner_id: r.created_by ? String(r.created_by) : null,
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : null,
          created_at: String(r.created_at),
          team: {
            nombre: String((t as Record<string, unknown>).nombre ?? ''),
            slug: String((t as Record<string, unknown>).slug ?? ''),
            logo_url: (t as Record<string, unknown>).logo_url as string | null,
          },
        })
      }

      for (const row of playerRows) {
        const r = row as Record<string, unknown>
        const u = Array.isArray(r.users) ? r.users[0] : r.users
        newItems.push({
          kind: 'player_post',
          id: String(r.id),
          post_owner_id: String(r.user_id ?? ''),
          user_id: String(r.user_id ?? ''),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : null,
          video_url: (r.video_url as string | null) ?? null,
          video_mp4_url: (r.video_mp4_url as string | null) ?? null,
          video_duration_s:
            r.video_duration_s != null && Number.isFinite(Number(r.video_duration_s))
              ? Number(r.video_duration_s)
              : undefined,
          mentions: mentionIdsFromRow(r),
          mentionAliasById: rowMentionAliasesFromMap(r, loadMoreAliasByUserId),
          replica_id: r.replica_id ? String(r.replica_id) : null,
          created_at: String(r.created_at),
          user: mapJoinedUserForPlayerPost(
            u ? (u as Record<string, unknown>) : null
          ),
        })
      }

      newItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      if (teamRows.length > 0) {
        const last = teamRows[teamRows.length - 1] as Record<string, unknown>
        setCursorTeamPosts(String(last.created_at))
      }
      if (playerRows.length > 0) {
        const last = playerRows[playerRows.length - 1] as Record<string, unknown>
        setCursorPlayerPosts(String(last.created_at))
      }

      setItems((prev) => [...prev, ...newItems])
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
      if (didAppendFromServer) touchFeedItemsTimestamp()
    }
  }, [cursorPlayerPosts, cursorTeamPosts, hasMore, loading])

  useLayoutEffect(() => {
    const cached = readFeedTabSessionCache()
    if (cached) {
      setItems(cached.items)
      setCursorPlayerPosts(cached.cursorPlayerPosts)
      setCursorTeamPosts(cached.cursorTeamPosts)
      setHasMore(cached.hasMore)
      setLoading(false)
      loadingMoreRef.current = false
      setLoadingMore(false)
      const yRaw = sessionStorage.getItem(FEED_SCROLL_Y_KEY)
      const y = yRaw != null ? Number(yRaw) : 0
      requestAnimationFrame(() => {
        const top = Number.isFinite(y) && y >= 0 ? y : 0
        const container = getScrollContainer()
        if (container instanceof Window) {
          container.scrollTo(0, top)
        } else {
          container.scrollTop = top
        }
      })
      return
    }
    void load()
  }, [load])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        try {
          sessionStorage.setItem(FEED_SCROLL_Y_KEY, String(getScrollTop()))
        } catch {
          /* ignore */
        }
      }, 150)
    }
    const scrollRoot = getScrollContainer()
    scrollRoot.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollRoot.removeEventListener('scroll', onScroll)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (loading || typeof window === 'undefined') return
    writeFeedItemsCacheOnly({
      items,
      cursorPlayerPosts,
      cursorTeamPosts,
      hasMore,
    })
  }, [items, cursorPlayerPosts, cursorTeamPosts, hasMore, loading])

  useEffect(() => {
    const onDeleted = () => {
      void load()
    }
    window.addEventListener('airnation:post-deleted', onDeleted)
    return () => window.removeEventListener('airnation:post-deleted', onDeleted)
  }, [load])

  useEffect(() => {
    if (loading) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, loadMore, items.length])

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="border border-[#EEEEEE] p-4">
          <div className="flex gap-3 mb-3">
            <div className="w-9 h-9 bg-[#F4F4F4] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-[#F4F4F4] animate-pulse" />
              <div className="h-2 w-16 bg-[#F4F4F4] animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-full bg-[#F4F4F4] animate-pulse mb-2" />
          <div className="h-4 w-3/4 bg-[#F4F4F4] animate-pulse" />
        </div>
      ))}
    </div>
  )

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p style={jost} className="text-[13px] font-extrabold uppercase text-[#666666]">La comunidad está arrancando</p>
      <p style={lato} className="mt-2 text-[13px] text-[#999999]">Pronto verás actividad de equipos y jugadores aquí</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => {
        if (item.kind === 'pinned_post') return (
          <PinnedPostCard
            key={`pin-${item.id}`}
            item={item}
            currentUserId={currentUserId}
            currentUserAlias={currentUserAlias}
            currentUserAvatar={currentUserAvatar}
            isAdmin={isAdmin}
          />
        )
        if (item.kind === 'team_post') {
          const teamRole =
            userTeams.find(
              (t) => String(t.id) === String(item.team_id)
            )?.rol ?? null
          return (
            <TeamPostCard
              key={`tp-${item.id}`}
              item={item}
              currentUserId={currentUserId}
              currentUserAlias={currentUserAlias}
              currentUserAvatar={currentUserAvatar}
              userTeamRole={teamRole}
              onPostDeleted={(id: string) => setItems(prev => prev.filter(x => x.id !== id))}
            />
          )
        }
        if (item.kind === 'player_post') return (
          <PlayerPostCard
            key={`pp-${item.id}`}
            item={item}
            currentUserId={currentUserId}
            currentUserAlias={currentUserAlias}
            currentUserAvatar={currentUserAvatar}
            isOwner={currentUserId === item.user_id}
            isAdmin={isAdmin}
          />
        )
        if (item.kind === 'field_post')
          return (
            <FieldPostCard
              key={`fp-${item.id}`}
              item={item}
              currentUserId={currentUserId}
              currentUserAlias={currentUserAlias}
              currentUserAvatar={currentUserAvatar}
              onPostDeleted={(id: string) => setItems(prev => prev.filter(x => x.id !== id))}
            />
          )
        if (item.kind === 'event')
          return (
            <EventCard
              key={`ev-${item.id}`}
              item={item}
              currentUserId={currentUserId}
              currentUserAlias={currentUserAlias}
              currentUserAvatar={currentUserAvatar}
            />
          )
        if (item.kind === 'new_team')
          return (
            <NewTeamCard
              key={`nt-${item.id}`}
              item={item}
              currentUserId={currentUserId}
              currentUserAlias={currentUserAlias}
              currentUserAvatar={currentUserAvatar}
            />
          )
        if (item.kind === 'video')
          return (
            <VideoCard
              key={`vid-${item.id}`}
              item={item}
              currentUserId={currentUserId}
              currentUserAlias={currentUserAlias}
              currentUserAvatar={currentUserAvatar}
            />
          )
        if (item.kind === 'noticia')
          return (
            <NoticiaFeedCard
              key={`not-${item.id}`}
              item={item}
              currentUserId={currentUserId}
              currentUserAlias={currentUserAlias}
              currentUserAvatar={currentUserAvatar}
            />
          )
        if (item.kind === 'marketplace_listing')
          return <MarketplaceFeedCard key={`ml-${item.id}`} item={item} />
        return null
      })}
      <div ref={sentinelRef} className="h-1 w-full shrink-0" aria-hidden />
      {loadingMore ? (
        <div className="flex justify-center py-4">
          <div
            className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-solid border-[#EEEEEE] border-t-[#CC4B37]"
            aria-hidden
          />
        </div>
      ) : null}
      {!hasMore && !loadingMore ? (
        <p
          style={jost}
          className="py-3 text-center text-[11px] font-extrabold uppercase tracking-wide text-[#999999]"
        >
          Ya viste todo por ahora
        </p>
      ) : null}
    </div>
  )
}

// ─── EVENTOS TAB ───
function CrearEventoBanner() {
  return (
    <Link
      href="/eventos/nuevo"
      style={jost}
      className="mb-4 flex items-center justify-between bg-[#CC4B37] px-4 py-4"
    >
      <div>
        <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#FFFFFF]">
          LA COMUNIDAD NECESITA EVENTOS
        </p>
        <p
          className="mt-0.5 text-[11px] font-normal uppercase tracking-wide text-white/75"
          style={{ fontFamily: "'Lato', sans-serif", textTransform: 'none', fontWeight: 400 }}
        >
          Organiza tu partida y compártela con todos.
        </p>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginLeft: 12 }}>
        <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  )
}

function EventosTab({
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
}: {
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
}) {
  const [items, setItems] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasOwnActiveEvent, setHasOwnActiveEvent] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [eventsResult, myEventResult] = await Promise.all([
        supabase.from('events')
          .select('id, title, fecha, imagen_url, fields(nombre, ciudad, foto_portada_url)')
          .eq('published', true)
          .eq('status', 'publicado')
          .gte('fecha', new Date().toISOString())
          .order('fecha', { ascending: true })
          .limit(20),
        supabase.from('events')
          .select('id')
          .eq('created_by', currentUserId ?? '')
          .eq('published', true)
          .gte('fecha', new Date().toISOString())
          .limit(1),
      ])

      setHasOwnActiveEvent((myEventResult.data ?? []).length > 0)

      setItems((eventsResult.data ?? []).map(row => {
        const r = row as Record<string, unknown>
        const f = Array.isArray(r.fields) ? r.fields[0] : r.fields
        return {
          id: String(r.id),
          title: String(r.title ?? ''),
          fecha: String(r.fecha ?? ''),
          imagen_url: (r.imagen_url as string | null) ?? null,
          field_foto: f ? (f as Record<string, unknown>).foto_portada_url as string | null : null,
          field_nombre: f ? String((f as Record<string, unknown>).nombre ?? '') || null : null,
          field_ciudad: f ? String((f as Record<string, unknown>).ciudad ?? '') || null : null,
        }
      }))
      setLoading(false)
    }
    void load()
  }, [currentUserId])

  if (loading) return <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <div key={i} className="h-20 border border-[#EEEEEE] animate-pulse" />)}</div>

  if (!items.length) return (
    <div>
      {!hasOwnActiveEvent && <CrearEventoBanner />}
      <p style={lato} className="py-12 text-center text-[13px] text-[#999999]">No hay eventos próximos</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {!hasOwnActiveEvent && <CrearEventoBanner />}
      {items.map(item => {
        const imagenFinal = item.imagen_url?.trim() || item.field_foto?.trim() || null
        return (
          <div key={item.id} className="border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
            <Link href={`/eventos/${item.id}`} className="flex gap-3 p-3">
              <div className="w-16 h-16 shrink-0 overflow-hidden bg-[#F4F4F4]">
                {imagenFinal
                  ? <img loading="lazy" decoding="async" src={imagenFinal} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="16" rx="1.5" stroke="#AAAAAA" strokeWidth="1.4" />
                        <path d="M3 9h18M8 5V3M16 5V3" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </div>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37]">{formatEventDate(item.fecha)}</p>
                <h3 style={jost} className="mt-0.5 line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">{item.title}</h3>
                {[item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ') &&
                  <p style={lato} className="mt-1 text-[11px] text-[#666666] truncate">
                    {[item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ')}
                  </p>
                }
              </div>
            </Link>
            <div className="px-3">
              <PostActions
                postType="event"
                postId={item.id}
                postOwnerId={null}
                currentUserId={currentUserId}
                currentUserAlias={currentUserAlias}
                currentUserAvatar={currentUserAvatar}
                shareUrl={`/eventos/${item.id}`}
                shareTitle={item.title}
                postHref={`/eventos/${item.id}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── EQUIPOS TAB ───
function EquiposTab() {
  const [items, setItems] = useState<TeamDirItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [estadoFilter, setEstadoFilter] = useState('')
  const [ciudadFilter, setCiudadFilter] = useState('')
  const [localEstado, setLocalEstado] = useState('')
  const [localCiudad, setLocalCiudad] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, nombre, slug, ciudad, estado, logo_url, foto_portada_url, destacado')
        .eq('status', 'activo')
        .order('destacado', { ascending: false })
        .order('created_at', { ascending: false })
      setItems((data ?? []) as TeamDirItem[])
      setLoading(false)
    }
    void load()
  }, [])

  const estados = useMemo(() => {
    const s = new Set<string>()
    for (const t of items) {
      if (t.estado?.trim()) s.add(t.estado.trim())
    }
    return Array.from(s).sort()
  }, [items])

  const ciudades = useMemo(() => {
    const s = new Set<string>()
    for (const t of items) {
      if (localEstado && t.estado?.trim() !== localEstado) continue
      if (t.ciudad?.trim()) s.add(t.ciudad.trim())
    }
    return Array.from(s).sort()
  }, [items, localEstado])

  const activeCount = useMemo(() => {
    let n = 0
    if (estadoFilter) n++
    if (ciudadFilter) n++
    return n
  }, [estadoFilter, ciudadFilter])

  const filtered = useMemo(() => {
    let list = items
    if (estadoFilter) list = list.filter(t => t.estado?.trim() === estadoFilter)
    if (ciudadFilter) list = list.filter(t => t.ciudad?.trim() === ciudadFilter)
    return list
  }, [items, estadoFilter, ciudadFilter])

  const handleOpen = () => {
    setLocalEstado(estadoFilter)
    setLocalCiudad(ciudadFilter)
    setSheetOpen(true)
  }

  const handleApply = () => {
    setEstadoFilter(localEstado)
    setCiudadFilter(localCiudad)
    setSheetOpen(false)
  }

  const handleClear = () => {
    setLocalEstado('')
    setLocalCiudad('')
  }

  if (loading) return (
    <div className="grid grid-cols-2 gap-3">
      {[0,1,2,3].map(i => (
        <div key={i} className="h-[200px] animate-pulse border border-[#EEEEEE] bg-[#F4F4F4]" />
      ))}
    </div>
  )

  return (
    <div>
      {/* Botón filtrar */}
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          style={jost}
          className="flex items-center gap-2 border border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] transition-colors hover:border-[#CCCCCC]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Filtrar
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center bg-[#CC4B37] text-[9px] font-extrabold text-white">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => { setEstadoFilter(''); setCiudadFilter('') }}
            style={jost}
            className="text-[11px] font-extrabold uppercase text-[#999999] underline-offset-2 hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Overlay */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSheetOpen(false)} />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed left-0 right-0 z-50 bg-white transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom))',
          borderRadius: '12px 12px 0 0',
          paddingBottom: '8px',
        }}
      >
        <div
          className="flex w-full cursor-pointer justify-center py-4"
          onClick={() => setSheetOpen(false)}
          style={{ minHeight: 44 }}
        >
          <div className="h-1 w-10 rounded-full bg-[#DDDDDD]" />
        </div>
        <div className="px-5 pb-6 pt-2">
          <div className="mb-5 flex items-center justify-between">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">Filtrar</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleClear} style={jost} className="text-[11px] font-extrabold uppercase text-[#999999] underline-offset-2 hover:underline">
                Limpiar
              </button>
              <button type="button" onClick={handleApply} style={jost} className="bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white">
                Aplicar
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p style={jost} className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]">
              Ubicación
            </p>
            <div className="flex flex-col gap-3">
              <select
                className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:outline-none focus:border-[#CC4B37]"
                value={localEstado}
                onChange={(e) => { setLocalEstado(e.target.value); setLocalCiudad('') }}
              >
                <option value="">Todos los estados</option>
                {estados.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              {localEstado && (
                <select
                  className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:outline-none focus:border-[#CC4B37]"
                  value={localCiudad}
                  onChange={(e) => setLocalCiudad(e.target.value)}
                >
                  <option value="">Todas las ciudades</option>
                  {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p style={lato} className="text-[13px] text-[#999999]">No hay equipos registrados aquí aún.</p>
          <Link href="/equipos/nuevo" style={jost} className="border border-[#CC4B37] bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]">
            CREAR EQUIPO
          </Link>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(team => {
            const initial = (team.nombre.trim()[0] || '?').toUpperCase()
            return (
              <Link
                key={team.id}
                href={`/equipos/${encodeURIComponent(team.slug)}`}
                className="group block border border-[#EEEEEE] bg-[#FFFFFF] transition-colors hover:border-[#CCCCCC]"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
                  {team.foto_portada_url ? (
                    <img loading="lazy" decoding="async" src={team.foto_portada_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-3xl font-extrabold text-white/90" style={jost}>{initial}</span>
                    </div>
                  )}
                  {team.destacado && (
                    <span className="absolute left-2 top-2 bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white" style={jost}>DESTACADO</span>
                  )}
                  <div className="absolute bottom-2 left-2 h-10 w-10 shrink-0 overflow-hidden border-2 border-white bg-[#111111]">
                    {team.logo_url ? (
                      <img loading="lazy" decoding="async" src={team.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] font-extrabold text-[#CC4B37]" style={jost}>{initial}</div>
                    )}
                  </div>
                </div>
                <div className="p-2">
                  <p className="line-clamp-1 text-[12px] font-extrabold uppercase leading-snug text-[#111111]" style={jost}>{team.nombre}</p>
                  {team.ciudad?.trim() ? (
                    <p className="mt-0.5 truncate text-[11px] text-[#666666]" style={lato}>{team.ciudad.trim()}</p>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Link href="/equipos/nuevo" style={jost} className="border border-[#111111] px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#111111] hover:text-[#FFFFFF]">
            + CREAR EQUIPO
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── NOTICIAS TAB ───
function NoticiasTab({
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
}: {
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
}) {
  const [items, setItems] = useState<NoticiaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('posts')
        .select('id, title, slug, excerpt, cover_url, category, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)
      setItems((data ?? []) as NoticiaItem[])
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) return <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <div key={i} className="h-24 border border-[#EEEEEE] animate-pulse" />)}</div>
  if (!items.length) return <p style={lato} className="py-12 text-center text-[13px] text-[#999999]">No hay noticias aún</p>

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <div key={item.id} className="border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
          <Link href={`/blog/${item.slug}`} className="flex gap-3 p-3">
            <div className="w-20 h-20 shrink-0 overflow-hidden bg-[#F4F4F4]">
              {item.cover_url
                ? <img loading="lazy" decoding="async" src={item.cover_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1Z" stroke="#AAAAAA" strokeWidth="1.4" strokeLinejoin="round" />
                      <path d="M15 3v4h4M9 11h6M9 15h4" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </div>
              }
            </div>
            <div className="min-w-0 flex-1">
              {item.category && <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37] mb-0.5">{item.category}</p>}
              <h3 style={jost} className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">{item.title}</h3>
              {item.excerpt && <p style={lato} className="mt-1 line-clamp-2 text-[11px] text-[#666666]">{item.excerpt}</p>}
            </div>
          </Link>
          <div className="px-3">
            <PostActions
              postType="noticia"
              postId={item.id}
              postOwnerId={null}
              currentUserId={currentUserId}
              currentUserAlias={currentUserAlias}
              currentUserAvatar={currentUserAvatar}
              shareUrl={`/blog/${item.slug}`}
              shareTitle={item.title}
              postHref={`/blog/${item.slug}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function VideosTab({
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
}: {
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
}) {
  const [items, setItems] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('videos')
        .select('id, title, youtube_url, thumbnail_url, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)
      setItems((data ?? []) as VideoItem[])
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[0,1,2].map(i => (
        <div key={i} className="border border-[#EEEEEE] animate-pulse">
          <div className="aspect-video w-full bg-[#F4F4F4]"/>
          <div className="p-3 space-y-2">
            <div className="h-3 w-full bg-[#F4F4F4]"/>
            <div className="h-2 w-20 bg-[#F4F4F4]"/>
          </div>
        </div>
      ))}
    </div>
  )

  if (!items.length) return (
    <p style={lato} className="py-12 text-center text-[13px] text-[#999999]">
      No hay videos aún
    </p>
  )

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <VideoCard
          key={item.id}
          item={{ kind: 'video', ...item }}
          currentUserId={currentUserId}
          currentUserAlias={currentUserAlias}
          currentUserAvatar={currentUserAvatar}
        />
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT ───
const TABS: { id: Tab; label: string }[] = [
  { id: 'feed', label: 'FEED' },
  { id: 'eventos', label: 'EVENTOS' },
  { id: 'equipos', label: 'EQUIPOS' },
  { id: 'noticias', label: 'NOTICIAS' },
  { id: 'videos', label: 'VIDEOS' },
]

export function FeedHome({
  userId,
  userAlias,
  userAvatar,
  userTeams,
  userFields,
  isAdmin,
}: {
  userId: string
  userAlias: string | null
  userAvatar: string | null
  userTeams: {
    id: string
    nombre: string
    slug: string
    logo_url: string | null
    rol: 'founder' | 'admin'
  }[]
  userFields: {
    id: string
    nombre: string
    slug: string
    foto_portada_url: string | null
  }[]
  isAdmin: boolean
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const rawTab = searchParams.get('tab')
  const activeTab: Tab = TABS.some((t) => t.id === rawTab)
    ? (rawTab as Tab)
    : 'feed'

  const setActiveTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'feed') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const query = params.toString()
    router.replace(pathname + (query ? `?${query}` : ''), { scroll: false })
  }

  const [feedKey, setFeedKey] = useState(0)

  return (
    <div>
      <div
        className="sticky top-0 z-30 border-b border-[#EEEEEE] bg-[#FFFFFF] -mx-4 px-4 md:-mx-6 md:px-6 md:relative md:z-auto"
      >
        <ScrollableTabsNav>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'nearest',
                  block: 'nearest',
                })
                setActiveTab(tab.id)
              }}
              style={jost}
              className={`shrink-0 border-b-2 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'border-[#CC4B37] text-[#111111]'
                  : 'border-transparent text-[#999999]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </ScrollableTabsNav>
      </div>

      {activeTab === 'feed' && (
        <PostBox
          userId={userId}
          userAlias={userAlias}
          userAvatar={userAvatar}
          userTeams={userTeams}
          userFields={userFields}
          onPublished={() => {
            setTimeout(() => {
              setFeedKey((prev) => prev + 1)
            }, 1500)
          }}
        />
      )}

      <div className="mt-4">
        {activeTab === 'feed' && (
          <FeedTab
            key={feedKey}
            currentUserId={userId}
            currentUserAlias={userAlias}
            currentUserAvatar={userAvatar}
            userTeams={userTeams.map((t) => ({
              id: t.id,
              slug: t.slug,
              rol: t.rol,
            }))}
            isAdmin={isAdmin}
          />
        )}
        {activeTab === 'eventos' && (
          <EventosTab
            currentUserId={userId}
            currentUserAlias={userAlias}
            currentUserAvatar={userAvatar}
          />
        )}
        {activeTab === 'equipos' && <EquiposTab />}
        {activeTab === 'noticias' && (
          <NoticiasTab
            currentUserId={userId}
            currentUserAlias={userAlias}
            currentUserAvatar={userAvatar}
          />
        )}
        {activeTab === 'videos' && (
          <VideosTab
            currentUserId={userId}
            currentUserAlias={userAlias}
            currentUserAvatar={userAvatar}
          />
        )}
      </div>
    </div>
  )
}
