'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { supabase } from '@/lib/supabase'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800,
  textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Tab = 'feed' | 'eventos' | 'equipos' | 'noticias' | 'videos'

// Tipos de items del feed
type FeedItem =
  | { kind: 'team_post'; id: string; content: string | null; fotos_urls: string[] | null; created_at: string; team: { nombre: string; slug: string; logo_url: string | null } }
  | { kind: 'player_post'; id: string; user_id: string; content: string | null; fotos_urls: string[] | null; created_at: string; user: { alias: string | null; nombre: string | null; avatar_url: string | null } }
  | { kind: 'event'; id: string; title: string; fecha: string; imagen_url: string | null; field_foto: string | null; field_nombre: string | null; field_ciudad: string | null; created_at: string }
  | { kind: 'new_team'; id: string; nombre: string; slug: string; ciudad: string | null; logo_url: string | null; foto_portada_url: string | null; created_at: string }
  | { kind: 'video'; id: string; title: string; youtube_url: string; thumbnail_url: string | null; created_at: string }
  | { kind: 'noticia'; id: string; title: string; slug: string; excerpt: string | null; cover_url: string | null; category: string | null; created_at: string }

type EventItem = { id: string; title: string; fecha: string; imagen_url: string | null; field_nombre: string | null; field_ciudad: string | null }
type TeamPostItem = { id: string; content: string | null; fotos_urls: string[] | null; created_at: string; team: { nombre: string; slug: string; logo_url: string | null } }
type NoticiaItem = { id: string; title: string; slug: string; excerpt: string | null; cover_url: string | null; category: string | null; created_at: string }
type VideoItem = { id: string; title: string; youtube_url: string; thumbnail_url: string | null; created_at: string }

type TeamDirItem = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  logo_url: string | null
  foto_portada_url: string | null
  destacado: boolean
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

function PostBox({
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
  userTeams: { id: string; nombre: string; slug: string; logo_url: string | null }[]
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
  const [pendingPhotos, setPendingPhotos] = useState<
    { id: string; file: File; preview: string }[]
  >([])
  const [publishing, setPublishing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://air-nation-production.up.railway.app/api/v1'
  ).replace(/\/$/, '')

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
    const next: { id: string; file: File; preview: string }[] = []
    for (const file of Array.from(files)) {
      if (pendingPhotos.length + next.length >= 4) break
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
        continue
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      next.push({ id, file, preview: URL.createObjectURL(file) })
    }
    setPendingPhotos((p) => [...p, ...next])
  }

  const clearPendingPhotos = () => {
    for (const p of pendingPhotos) URL.revokeObjectURL(p.preview)
    setPendingPhotos([])
  }

  const handlePublish = async () => {
    if ((!text.trim() && pendingPhotos.length === 0) || publishing) return
    setPublishing(true)
    try {
      const urls: string[] = []
      for (const p of pendingPhotos) {
        const fd = new FormData()
        fd.append('file', p.file)
        const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: fd })
        const json = (await res.json()) as { url?: string }
        if (json.url) urls.push(json.url)
      }

      const content = text.trim() || null

      if (postAs.type === 'player') {
        const { error } = await supabase.from('player_posts').insert({
          user_id: userId,
          content,
          fotos_urls: urls,
          published: true,
        })
        if (error) throw error
      } else if (postAs.type === 'team') {
        const { error } = await supabase.from('team_posts').insert({
          team_id: postAs.id,
          content,
          fotos_urls: urls,
          published: true,
          created_by: userId,
        })
        if (error) throw error
      } else if (postAs.type === 'field') {
        const { error } = await supabase.from('field_posts').insert({
          field_id: postAs.id,
          content,
          fotos_urls: urls,
          created_by: userId,
        })
        if (error) throw error
      }

      setText('')
      for (const p of pendingPhotos) URL.revokeObjectURL(p.preview)
      setPendingPhotos([])
      setExpanded(false)
      onPublished()
    } catch {
      /* noop */
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
    <div className="mb-4 border border-[#EEEEEE] bg-[#FFFFFF] p-4">
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

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        placeholder="¿Qué quieres compartir?"
        rows={3}
        className="w-full resize-none border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[14px] text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
        style={lato}
        autoFocus
      />

      {pendingPhotos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {pendingPhotos.map((p) => (
            <div
              key={p.id}
              className="relative h-16 w-16 overflow-hidden bg-[#F4F4F4]"
            >
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
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
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setExpanded(false)
              setText('')
              clearPendingPhotos()
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
              (!text.trim() && pendingPhotos.length === 0) || publishing
            }
            style={jost}
            className="bg-[#CC4B37] px-4 py-2 text-[11px] text-white disabled:opacity-50"
          >
            {publishing ? 'PUBLICANDO...' : 'PUBLICAR'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Lightbox({ urls, startIndex, onClose }: {
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

function PhotoGrid({ urls }: { urls: string[] }) {
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

// ─── CARD COMPONENTS ───

function TeamPostCard({ item }: { item: Extract<FeedItem, { kind: 'team_post' }> }) {
  const fotos = (item.fotos_urls ?? []).slice(0, 4)
  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/equipos/${item.team.slug}`}>
          <div className="w-9 h-9 bg-[#F4F4F4] overflow-hidden shrink-0">
            {item.team.logo_url
              ? <img src={item.team.logo_url} alt="" className="w-full h-full object-cover" />
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
      </div>
      {item.content?.trim() && (
        <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">{item.content}</p>
      )}
      {fotos.length > 0 && <PhotoGrid urls={fotos} />}
    </div>
  )
}

function PlayerPostCard({ item }: { item: Extract<FeedItem, { kind: 'player_post' }> }) {
  const fotos = (item.fotos_urls ?? []).slice(0, 4)
  const name = item.user.alias?.trim() || item.user.nombre?.trim() || 'Jugador'
  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="mb-3">
        <Link href={`/u/${item.user_id}`} className="flex items-center gap-3 min-w-0 w-fit max-w-full">
          <div className="w-9 h-9 bg-[#F4F4F4] overflow-hidden shrink-0 rounded-full">
            {item.user.avatar_url
              ? <img src={item.user.avatar_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[#CC4B37] text-sm font-bold" style={jost}>{name[0].toUpperCase()}</div>
            }
          </div>
          <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111] hover:text-[#CC4B37] truncate">{name}</p>
        </Link>
        <p style={lato} className="text-[11px] text-[#999999] mt-0.5 ml-12">{formatRelativeTime(item.created_at)}</p>
      </div>
      {item.content?.trim() && (
        <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">{item.content}</p>
      )}
      {fotos.length > 0 && <PhotoGrid urls={fotos} />}
    </div>
  )
}

function EventCard({ item }: { item: Extract<FeedItem, { kind: 'event' }> }) {
  const sub = [item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ')
  const imagenFinal = item.imagen_url?.trim() || item.field_foto?.trim() || null
  return (
    <Link href={`/eventos/${item.id}`}
      className="block border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
      {/* Banner */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
        {imagenFinal
          ? <img src={imagenFinal} alt="" className="w-full h-full object-cover" />
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
  )
}

function NewTeamCard({ item }: { item: Extract<FeedItem, { kind: 'new_team' }> }) {
  const initial = (item.nombre.trim()[0] || '?').toUpperCase()
  return (
    <Link href={`/equipos/${encodeURIComponent(item.slug)}`}
      className="block border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
      {/* Foto portada si existe */}
      {item.foto_portada_url && (
        <div className="relative h-[140px] w-full overflow-hidden bg-[#111111]">
          <img src={item.foto_portada_url} alt="" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="flex items-center gap-3 p-3">
        <div className="w-12 h-12 shrink-0 overflow-hidden bg-[#F4F4F4] border border-[#EEEEEE]">
          {item.logo_url
            ? <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
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
  )
}

function VideoCard({ item }: { item: Extract<FeedItem, { kind: 'video' }> }) {
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
              <img src={thumb} alt="" className="w-full h-full object-cover opacity-90"/>
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
    </div>
  )
}

function NoticiaFeedCard({ item }: { item: Extract<FeedItem, { kind: 'noticia' }> }) {
  return (
    <Link href={`/blog/${item.slug}`}
      className="block border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden">
      {item.cover_url && (
        <div className="aspect-[16/7] w-full overflow-hidden bg-[#F4F4F4]">
          <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
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
  )
}

// ─── FEED TAB ───
/** Recarga con `key` desde el padre tras publicar. Paginación / scroll infinito: ampliar límites y cursores aquí. */
function FeedTab() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [teamPostsRes, playerPostsRes, eventsRes, teamsRes, videosRes, noticiasRes] = await Promise.all([
        supabase.from('team_posts')
          .select('id, content, fotos_urls, created_at, teams(nombre, slug, logo_url)')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('player_posts')
          .select('id, user_id, content, fotos_urls, created_at, users(alias, nombre, avatar_url)')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(10),
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
          .limit(3),
        supabase.from('posts')
          .select('id, title, slug, excerpt, cover_url, category, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      const feedItems: FeedItem[] = []

      for (const row of teamPostsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const t = Array.isArray(r.teams) ? r.teams[0] : r.teams
        if (!t) continue
        feedItems.push({
          kind: 'team_post',
          id: String(r.id),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : null,
          created_at: String(r.created_at),
          team: { nombre: String((t as Record<string, unknown>).nombre ?? ''), slug: String((t as Record<string, unknown>).slug ?? ''), logo_url: (t as Record<string, unknown>).logo_url as string | null },
        })
      }

      for (const row of playerPostsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const u = Array.isArray(r.users) ? r.users[0] : r.users
        feedItems.push({
          kind: 'player_post',
          id: String(r.id),
          user_id: String(r.user_id ?? ''),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : null,
          created_at: String(r.created_at),
          user: { alias: u ? String((u as Record<string, unknown>).alias ?? '') || null : null, nombre: u ? String((u as Record<string, unknown>).nombre ?? '') || null : null, avatar_url: u ? (u as Record<string, unknown>).avatar_url as string | null : null },
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

      // Mezclar por created_at DESC
      feedItems.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setItems(feedItems)
      setLoading(false)
    }
    void load()
  }, [])

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
        if (item.kind === 'team_post') return <TeamPostCard key={`tp-${item.id}`} item={item} />
        if (item.kind === 'player_post') return <PlayerPostCard key={`pp-${item.id}`} item={item} />
        if (item.kind === 'event') return <EventCard key={`ev-${item.id}`} item={item} />
        if (item.kind === 'new_team') return <NewTeamCard key={`nt-${item.id}`} item={item} />
        if (item.kind === 'video') return <VideoCard key={`vid-${item.id}`} item={item}/>
        if (item.kind === 'noticia') return <NoticiaFeedCard key={`not-${item.id}`} item={item}/>
        return null
      })}
    </div>
  )
}

// ─── EVENTOS TAB ───
function EventosTab() {
  const [items, setItems] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('events')
        .select('id, title, fecha, imagen_url, fields(nombre, ciudad)')
        .eq('published', true)
        .eq('status', 'publicado')
        .gte('fecha', new Date().toISOString())
        .order('fecha', { ascending: true })
        .limit(20)

      setItems((data ?? []).map(row => {
        const r = row as Record<string, unknown>
        const f = Array.isArray(r.fields) ? r.fields[0] : r.fields
        return {
          id: String(r.id),
          title: String(r.title ?? ''),
          fecha: String(r.fecha ?? ''),
          imagen_url: (r.imagen_url as string | null) ?? null,
          field_nombre: f ? String((f as Record<string, unknown>).nombre ?? '') || null : null,
          field_ciudad: f ? String((f as Record<string, unknown>).ciudad ?? '') || null : null,
        }
      }))
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) return <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <div key={i} className="h-20 border border-[#EEEEEE] animate-pulse" />)}</div>
  if (!items.length) return <p style={lato} className="py-12 text-center text-[13px] text-[#999999]">No hay eventos próximos</p>

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <Link key={item.id} href={`/eventos/${item.id}`} className="flex gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-3">
          <div className="w-16 h-16 shrink-0 overflow-hidden bg-[#F4F4F4]">
            {item.imagen_url ? <img src={item.imagen_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="1.5" stroke="#AAAAAA" strokeWidth="1.4" /><path d="M3 9h18M8 5V3M16 5V3" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" /></svg></div>}
          </div>
          <div className="min-w-0 flex-1">
            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37]">{formatEventDate(item.fecha)}</p>
            <h3 style={jost} className="mt-0.5 line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">{item.title}</h3>
            {[item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ') && <p style={lato} className="mt-1 text-[11px] text-[#666666] truncate">{[item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ')}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── EQUIPOS TAB ───
function EquiposTab() {
  const [items, setItems] = useState<TeamDirItem[]>([])
  const [loading, setLoading] = useState(true)
  const [ciudadFilter, setCiudadFilter] = useState<string>('todas')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, nombre, slug, ciudad, logo_url, foto_portada_url, destacado')
        .eq('status', 'activo')
        .order('destacado', { ascending: false })
        .order('created_at', { ascending: false })
      setItems((data ?? []) as TeamDirItem[])
      setLoading(false)
    }
    void load()
  }, [])

  const ciudades = ['todas', ...Array.from(
    new Set(items.map(t => t.ciudad?.trim()).filter(Boolean) as string[])
  ).sort()]

  const filtered = ciudadFilter === 'todas'
    ? items
    : items.filter(t => t.ciudad?.trim() === ciudadFilter)

  if (loading) return (
    <div className="grid grid-cols-2 gap-3">
      {[0,1,2,3].map(i => (
        <div key={i} className="h-[200px] animate-pulse border border-[#EEEEEE] bg-[#F4F4F4]" />
      ))}
    </div>
  )

  return (
    <div>
      {/* Filtro ciudades */}
      {ciudades.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ciudades.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCiudadFilter(c)}
              style={jost}
              className={`shrink-0 border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                ciudadFilter === c
                  ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                  : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
              }`}
            >
              {c === 'todas' ? 'TODAS' : c}
            </button>
          ))}
        </div>
      )}

      {/* Sin resultados para esa ciudad */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p style={lato} className="text-[13px] text-[#999999]">
            No hay equipos registrados en {ciudadFilter === 'todas' ? 'México' : ciudadFilter} aún.
          </p>
          <Link
            href="/equipos/nuevo"
            style={jost}
            className="border border-[#CC4B37] bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
          >
            CREAR EQUIPO
          </Link>
        </div>
      )}

      {/* Grid de cards */}
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
                {/* Portada */}
                <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
                  {team.foto_portada_url ? (
                    <img src={team.foto_portada_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-3xl font-extrabold text-white/90" style={jost}>{initial}</span>
                    </div>
                  )}
                  {team.destacado && (
                    <span
                      className="absolute left-2 top-2 bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white"
                      style={jost}
                    >
                      DESTACADO
                    </span>
                  )}
                  {/* Logo */}
                  <div className="absolute bottom-2 left-2 h-10 w-10 shrink-0 overflow-hidden border-2 border-white bg-[#111111]">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] font-extrabold text-[#CC4B37]" style={jost}>
                        {initial}
                      </div>
                    )}
                  </div>
                </div>
                {/* Info */}
                <div className="p-2">
                  <p className="line-clamp-1 text-[12px] font-extrabold uppercase leading-snug text-[#111111]" style={jost}>
                    {team.nombre}
                  </p>
                  {team.ciudad?.trim() ? (
                    <p className="mt-0.5 truncate text-[11px] text-[#666666]" style={lato}>
                      {team.ciudad.trim()}
                    </p>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* CTA al final siempre */}
      {filtered.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Link
            href="/equipos/nuevo"
            style={jost}
            className="border border-[#111111] px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#111111] hover:text-[#FFFFFF]"
          >
            + CREAR EQUIPO
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── NOTICIAS TAB ───
function NoticiasTab() {
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
        <Link key={item.id} href={`/blog/${item.slug}`} className="flex gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-3">
          <div className="w-20 h-20 shrink-0 overflow-hidden bg-[#F4F4F4]">
            {item.cover_url ? <img src={item.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1Z" stroke="#AAAAAA" strokeWidth="1.4" strokeLinejoin="round" /><path d="M15 3v4h4M9 11h6M9 15h4" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" /></svg></div>}
          </div>
          <div className="min-w-0 flex-1">
            {item.category && <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37] mb-0.5">{item.category}</p>}
            <h3 style={jost} className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">{item.title}</h3>
            {item.excerpt && <p style={lato} className="mt-1 line-clamp-2 text-[11px] text-[#666666]">{item.excerpt}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

function VideosTab() {
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

/** Alineado con AppShell md:pt-16 (navbar desktop); en móvil top 0. */
function useDashboardStickyTabsTopPx() {
  const [topPx, setTopPx] = useState(0)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setTopPx(mq.matches ? 64 : 0)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return topPx
}

export function FeedHome({
  userId,
  userAlias,
  userAvatar,
  userTeams,
  userFields,
}: {
  userId: string
  userAlias: string | null
  userAvatar: string | null
  userTeams: {
    id: string
    nombre: string
    slug: string
    logo_url: string | null
  }[]
  userFields: {
    id: string
    nombre: string
    slug: string
    foto_portada_url: string | null
  }[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('feed')
  const [feedKey, setFeedKey] = useState(0)
  const stickyTabsTopPx = useDashboardStickyTabsTopPx()

  return (
    <div>
      <div
        className="z-30 border-b border-[#EEEEEE] bg-[#FFFFFF] -mx-4 px-4 md:-mx-6 md:px-6 md:!relative"
        style={{ position: 'sticky', top: stickyTabsTopPx }}
      >
        <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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
        </div>
      </div>

      {activeTab === 'feed' && (
        <PostBox
          userId={userId}
          userAlias={userAlias}
          userAvatar={userAvatar}
          userTeams={userTeams}
          userFields={userFields}
          onPublished={() => {
            setFeedKey((prev) => prev + 1)
          }}
        />
      )}

      <div className="mt-4">
        {activeTab === 'feed' && <FeedTab key={feedKey} />}
        {activeTab === 'eventos' && <EventosTab />}
        {activeTab === 'equipos' && <EquiposTab />}
        {activeTab === 'noticias' && <NoticiasTab />}
        {activeTab === 'videos' && <VideosTab />}
      </div>
    </div>
  )
}
