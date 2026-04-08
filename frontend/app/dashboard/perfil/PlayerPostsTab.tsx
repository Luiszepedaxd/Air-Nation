'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PhotoGrid } from '@/components/posts/PhotoGrid'
import { PostActions, PostMenu } from '@/components/posts/PostInteractions'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const ALLOWED_IMG = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_POST_PHOTOS = 4
const MAX_MB = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

type PlayerPost = {
  id: string
  user_id: string
  content: string | null
  fotos_urls: string[] | null
  published: boolean
  created_at: string
}

type PendingPhoto = { id: string; file: File; preview: string }

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMG.has(file.type)) return 'Solo se permiten JPG, PNG o WebP'
  if (file.size > MAX_BYTES) return `Cada foto puede pesar máximo ${MAX_MB} MB`
  return null
}

async function uploadOneFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: fd })
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok) throw new Error(json.error || 'Error al subir la imagen')
  if (!json.url || typeof json.url !== 'string') throw new Error('Respuesta inválida')
  return json.url
}

function normalizeFotoUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function SpinnerInline({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'h-5 w-5 animate-spin text-[#FFFFFF]'}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function PlayerPostsTab({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<PlayerPost[]>([])
  const [loading, setLoading] = useState(true)
  const [postText, setPostText] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const [publishing, setPublishing] = useState(false)
  const [pickErr, setPickErr] = useState('')
  const postInputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useRef(pendingPhotos)
  pendingRef.current = pendingPhotos

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview))
    }
  }, [])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('player_posts')
      .select('id, user_id, content, fotos_urls, published, created_at')
      .eq('user_id', userId)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) setPosts(data as PlayerPost[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  const removePending = (id: string) => {
    setPendingPhotos((prev) => {
      const found = prev.find((x) => x.id === id)
      if (found) URL.revokeObjectURL(found.preview)
      return prev.filter((x) => x.id !== id)
    })
  }

  const addPostFiles = (files: FileList | null) => {
    if (!files?.length) return
    setPickErr('')
    const next: PendingPhoto[] = []
    let firstErr: string | null = null
    for (const file of Array.from(files)) {
      if (pendingPhotos.length + next.length >= MAX_POST_PHOTOS) break
      const err = validateImageFile(file)
      if (err) {
        if (!firstErr) firstErr = err
        continue
      }
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      next.push({ id, file, preview: URL.createObjectURL(file) })
    }
    if (firstErr) setPickErr(firstErr)
    if (next.length) setPendingPhotos((p) => [...p, ...next])
    if (postInputRef.current) postInputRef.current.value = ''
  }

  const canPublish = postText.trim().length > 0 || pendingPhotos.length > 0

  const handlePublish = async () => {
    if (!canPublish || publishing) return
    setPublishing(true)
    try {
      const urls: string[] = []
      for (const p of pendingPhotos) {
        urls.push(await uploadOneFile(p.file))
      }
      const text = postText.trim()
      const { data, error } = await supabase
        .from('player_posts')
        .insert({
          user_id: userId,
          content: text.length ? text : null,
          fotos_urls: urls,
          published: true,
        })
        .select('id, user_id, content, fotos_urls, published, created_at')
        .single()

      if (error) throw error

      if (data) setPosts((prev) => [data as PlayerPost, ...prev])

      setPostText('')
      for (const p of pendingPhotos) URL.revokeObjectURL(p.preview)
      setPendingPhotos([])
    } catch {
      /* noop */
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="mx-auto max-w-[640px] pb-10">
      <div>
        <div className="relative">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value.slice(0, 500))}
            placeholder="¿Qué quieres compartir con la comunidad?"
            rows={4}
            className="min-h-[100px] w-full resize-y border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 pb-8 pt-3 text-[14px] text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
            style={lato}
            maxLength={500}
          />
          <span
            className="pointer-events-none absolute bottom-2 right-2 text-[11px] text-[#999999]"
            style={lato}
          >
            {postText.length}/500
          </span>
        </div>

        <div className="mt-4">
          <input
            ref={postInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addPostFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => postInputRef.current?.click()}
            disabled={pendingPhotos.length >= MAX_POST_PHOTOS}
            style={jost}
            className="inline-flex items-center gap-2 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconCamera />
            AGREGAR FOTOS
          </button>
        </div>

        {pickErr ? (
          <p className="mt-2 text-[12px] text-[#CC4B37]" style={lato} role="alert">
            {pickErr}
          </p>
        ) : null}

        {pendingPhotos.length > 0 ? (
          <div className="mt-4 grid w-fit grid-cols-2 gap-2">
            {pendingPhotos.map((p) => (
              <div
                key={p.id}
                className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#F4F4F4]"
              >
                <img src={p.preview} alt="" width={80} height={80} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePending(p.id)}
                  className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-[rgba(0,0,0,0.5)] text-[12px] font-bold text-white"
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={!canPublish || publishing}
            style={jost}
            className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center gap-2 bg-[#CC4B37] px-6 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? (
              <>
                <SpinnerInline />
                <span>Subiendo…</span>
              </>
            ) : (
              'PUBLICAR'
            )}
          </button>
        </div>
      </div>

      <hr className="my-8 border-0 border-t border-solid border-[#EEEEEE]" />

      {loading ? (
        <ul className="flex flex-col" aria-busy aria-label="Cargando publicaciones">
          {[0, 1, 2].map((k) => (
            <li key={k} className="list-none">
              <div className="mx-auto mb-4 w-full max-w-[600px] animate-pulse border border-solid border-[#EEEEEE] p-4">
                <div className="mb-3 h-4 max-w-[85%] rounded-sm bg-[#EEEEEE]" />
                <div className="grid grid-cols-2 gap-[2px]">
                  <div className="h-[140px] bg-[#EEEEEE]" />
                  <div className="h-[140px] bg-[#F4F4F4]" />
                </div>
                <div className="mt-3 h-3 w-24 rounded-sm bg-[#F4F4F4]" />
              </div>
            </li>
          ))}
        </ul>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <p style={lato} className="text-[14px] text-[#666666]">
            Aún no hay publicaciones
          </p>
        </div>
      ) : (
        <ul className="flex w-full min-w-0 flex-col">
          {posts.map((post) => {
            const urls = normalizeFotoUrls(post.fotos_urls).slice(0, 4)
            return (
              <li key={post.id} className="list-none">
                <div className="mx-auto mb-4 w-full max-w-[600px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] text-[#999999]" style={lato}>
                      {formatDate(post.created_at)}
                    </p>
                    <PostMenu
                      canDelete={true}
                      onDelete={async () => {
                        const { error } = await supabase
                          .from('player_posts')
                          .delete()
                          .eq('id', post.id)
                          .eq('user_id', userId)
                        if (!error) {
                          setPosts((prev) => prev.filter((x) => x.id !== post.id))
                        }
                      }}
                    />
                  </div>
                  {post.content?.trim() ? (
                    <p
                      className="mb-3 min-w-0 max-w-full break-words whitespace-pre-wrap text-[14px] text-[#111111]"
                      style={lato}
                    >
                      {post.content.trim()}
                    </p>
                  ) : null}
                  {urls.length > 0 && <PhotoGrid urls={urls} />}
                  <PostActions
                    postType="player"
                    postId={post.id}
                    postOwnerId={userId}
                    postHref={`/u/${userId}`}
                    currentUserId={userId}
                    currentUserAlias={null}
                    currentUserAvatar={null}
                    shareUrl={`/u/${userId}`}
                    shareTitle="Publicación en AirNation"
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
