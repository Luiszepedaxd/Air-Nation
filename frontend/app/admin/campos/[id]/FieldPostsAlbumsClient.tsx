'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  adminCreateFieldAlbum,
  adminCreateFieldPost,
  adminDeleteFieldAlbum,
  adminDeleteFieldPost,
} from '../actions'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const UPLOAD_ENDPOINT = `${API_URL}/upload`

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const lato = { fontFamily: "'Lato', sans-serif" } as const

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_POST_PHOTOS = 4
const MAX_MB = 5

async function postUpload(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd })
  const json = (await res.json().catch(() => ({}))) as {
    url?: string
    error?: string
  }
  if (!res.ok) throw new Error(json.error || 'Error al subir.')
  if (!json.url || typeof json.url !== 'string') throw new Error('Respuesta inválida.')
  return json.url
}

type PostRow = {
  id: string
  content: string
  fotos_urls: string[] | null
  created_at: string | null
}

type AlbumRow = {
  id: string
  nombre: string
  fotos_urls: string[] | null
  created_at: string | null
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function FieldPostsAlbumsClient({
  fieldId,
  initialPosts,
  initialAlbums,
}: {
  fieldId: string
  initialPosts: PostRow[]
  initialAlbums: AlbumRow[]
}) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [albums, setAlbums] = useState(initialAlbums)
  const [postContent, setPostContent] = useState('')
  const [postFiles, setPostFiles] = useState<File[]>([])
  const [postPreviewUrls, setPostPreviewUrls] = useState<string[]>([])
  const [albumName, setAlbumName] = useState('')
  const [albumFiles, setAlbumFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [showPostForm, setShowPostForm] = useState(false)
  const [showAlbumForm, setShowAlbumForm] = useState(false)

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  useEffect(() => {
    setAlbums(initialAlbums)
  }, [initialAlbums])

  useEffect(() => {
    const next = postFiles.map((f) => URL.createObjectURL(f))
    setPostPreviewUrls(next)
    return () => {
      next.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [postFiles])

  const onPostFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (picked.length === 0) return
    setPostFiles((prev) => {
      const merged = [...prev]
      for (const f of picked) {
        if (merged.length >= MAX_POST_PHOTOS) break
        merged.push(f)
      }
      return merged
    })
  }

  const removePostFileAt = (index: number) => {
    setPostFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onAlbumFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    setAlbumFiles(files)
  }

  const submitPost = async () => {
    setErr('')
    const text = postContent.trim()
    if (!text) {
      setErr('Escribe el contenido del post.')
      return
    }
    setBusy(true)
    try {
      const urls: string[] = []
      for (const f of postFiles) {
        if (!ALLOWED.has(f.type)) {
          setErr('Solo JPG, PNG o WebP.')
          setBusy(false)
          return
        }
        if (f.size > MAX_MB * 1024 * 1024) {
          setErr(`Cada imagen máx. ${MAX_MB} MB.`)
          setBusy(false)
          return
        }
        urls.push(await postUpload(f))
      }
      const res = await adminCreateFieldPost(fieldId, text, urls)
      if ('error' in res) {
        setErr(res.error)
        setBusy(false)
        return
      }
      setPostContent('')
      setPostFiles([])
      setShowPostForm(false)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al publicar.')
    } finally {
      setBusy(false)
    }
  }

  const submitAlbum = async () => {
    setErr('')
    const name = albumName.trim()
    if (!name) {
      setErr('Indica el nombre del álbum.')
      return
    }
    if (albumFiles.length === 0) {
      setErr('Añade al menos una foto.')
      return
    }
    setBusy(true)
    try {
      const urls: string[] = []
      for (const f of albumFiles) {
        if (!ALLOWED.has(f.type)) {
          setErr('Solo JPG, PNG o WebP.')
          setBusy(false)
          return
        }
        if (f.size > MAX_MB * 1024 * 1024) {
          setErr(`Cada imagen máx. ${MAX_MB} MB.`)
          setBusy(false)
          return
        }
        urls.push(await postUpload(f))
      }
      const res = await adminCreateFieldAlbum(fieldId, name, urls)
      if ('error' in res) {
        setErr(res.error)
        setBusy(false)
        return
      }
      setAlbumName('')
      setAlbumFiles([])
      setShowAlbumForm(false)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al crear álbum.')
    } finally {
      setBusy(false)
    }
  }

  const delPost = async (postId: string) => {
    if (!window.confirm('¿Eliminar este post?')) return
    setErr('')
    const res = await adminDeleteFieldPost(postId, fieldId)
    if ('error' in res) {
      setErr(res.error)
      return
    }
    setPosts((p) => p.filter((x) => x.id !== postId))
    router.refresh()
  }

  const delAlbum = async (albumId: string) => {
    if (!window.confirm('¿Eliminar este álbum?')) return
    setErr('')
    const res = await adminDeleteFieldAlbum(albumId, fieldId)
    if ('error' in res) {
      setErr(res.error)
      return
    }
    setAlbums((a) => a.filter((x) => x.id !== albumId))
    router.refresh()
  }

  return (
    <div className="mt-12 space-y-12 border-t border-solid border-[#EEEEEE] pt-12">
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            className="text-[11px] tracking-[0.14em] text-[#111111]"
            style={jost}
          >
            POSTS DEL CAMPO
          </h2>
          <button
            type="button"
            onClick={() => {
              setShowPostForm((v) => !v)
              setErr('')
            }}
            disabled={busy}
            className="border border-[#111111] bg-[#111111] px-3 py-2 text-[0.65rem] tracking-[0.12em] text-white disabled:opacity-50"
            style={{ ...jost, borderRadius: 2 }}
          >
            NUEVO POST
          </button>
        </div>

        {showPostForm ? (
          <div className="mb-6 border border-[#EEEEEE] bg-[#F4F4F4] p-4">
            <label className="mb-2 block text-[11px] text-[#666666]" style={jost}>
              Contenido
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={4}
              className="w-full border border-[#EEEEEE] bg-white px-3 py-2 text-sm text-[#111111]"
              style={lato}
            />
            <p className="mt-3 text-[11px] text-[#666666]" style={jost}>
              Fotos (máx. {MAX_POST_PHOTOS})
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-1 text-sm"
              onChange={onPostFiles}
            />
            {postPreviewUrls.length > 0 ? (
              <div className="mt-3 grid max-w-[280px] grid-cols-4 gap-2">
                {postPreviewUrls.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="relative aspect-square overflow-hidden border border-[#EEEEEE] bg-[#F4F4F4]"
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePostFileAt(i)}
                      disabled={busy}
                      className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-[#111111] text-[13px] font-bold leading-none text-white disabled:opacity-50"
                      aria-label="Quitar foto"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void submitPost()}
              disabled={busy}
              className="mt-4 bg-[#CC4B37] px-4 py-2 text-[0.65rem] tracking-[0.12em] text-white disabled:opacity-50"
              style={{ ...jost, borderRadius: 2 }}
            >
              PUBLICAR POST
            </button>
          </div>
        ) : null}

        {posts.length === 0 ? (
          <p className="text-sm text-[#666666]" style={lato}>
            No hay posts.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-6 p-0">
            {posts.map((p) => {
              const urls = Array.isArray(p.fotos_urls) ? p.fotos_urls : []
              return (
                <li
                  key={p.id}
                  className="border border-[#EEEEEE] bg-[#FFFFFF] p-4"
                >
                  <p className="whitespace-pre-wrap text-sm text-[#111111]" style={lato}>
                    {p.content}
                  </p>
                  {urls.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {urls.map((u) => (
                        <a
                          key={u}
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square overflow-hidden bg-[#F4F4F4]"
                        >
                          <img src={u} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[#999999]" style={lato}>
                      {formatFecha(p.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void delPost(p.id)}
                      disabled={busy}
                      className="text-[0.65rem] tracking-[0.1em] text-[#CC4B37] disabled:opacity-50"
                      style={jost}
                    >
                      ELIMINAR
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2
            className="text-[11px] tracking-[0.14em] text-[#111111]"
            style={jost}
          >
            ÁLBUMES DEL CAMPO
          </h2>
          <button
            type="button"
            onClick={() => {
              setShowAlbumForm((v) => !v)
              setErr('')
            }}
            disabled={busy}
            className="border border-[#111111] bg-[#111111] px-3 py-2 text-[0.65rem] tracking-[0.12em] text-white disabled:opacity-50"
            style={{ ...jost, borderRadius: 2 }}
          >
            NUEVO ÁLBUM
          </button>
        </div>

        {showAlbumForm ? (
          <div className="mb-6 border border-[#EEEEEE] bg-[#F4F4F4] p-4">
            <label className="mb-2 block text-[11px] text-[#666666]" style={jost}>
              Nombre del álbum
            </label>
            <input
              type="text"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              className="w-full border border-[#EEEEEE] bg-white px-3 py-2 text-sm"
              style={lato}
            />
            <p className="mt-3 text-[11px] text-[#666666]" style={jost}>
              Fotos
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-1 text-sm"
              onChange={onAlbumFiles}
            />
            <button
              type="button"
              onClick={() => void submitAlbum()}
              disabled={busy}
              className="mt-4 bg-[#CC4B37] px-4 py-2 text-[0.65rem] tracking-[0.12em] text-white disabled:opacity-50"
              style={{ ...jost, borderRadius: 2 }}
            >
              CREAR ÁLBUM
            </button>
          </div>
        ) : null}

        {albums.length === 0 ? (
          <p className="text-sm text-[#666666]" style={lato}>
            No hay álbumes.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-8 p-0">
            {albums.map((a) => {
              const urls = Array.isArray(a.fotos_urls) ? a.fotos_urls : []
              return (
                <li key={a.id} className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#111111]" style={jost}>
                      {a.nombre}
                    </h3>
                    <button
                      type="button"
                      onClick={() => void delAlbum(a.id)}
                      disabled={busy}
                      className="text-[0.65rem] tracking-[0.1em] text-[#CC4B37] disabled:opacity-50"
                      style={jost}
                    >
                      ELIMINAR
                    </button>
                  </div>
                  {urls.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {urls.map((u) => (
                        <a
                          key={u}
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-square overflow-hidden bg-[#F4F4F4]"
                        >
                          <img src={u} alt="" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-[#999999]" style={lato}>
                    {formatFecha(a.created_at)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {err ? (
        <p className="text-sm text-[#CC4B37]" role="alert" style={lato}>
          {err}
        </p>
      ) : null}
    </div>
  )
}
