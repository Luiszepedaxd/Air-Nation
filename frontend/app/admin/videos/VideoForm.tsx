'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  createVideo,
  updateVideo,
  toggleVideoPublish,
  type VideoInput,
} from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[#111111] outline-none focus:border-[#CC4B37]'

const CATEGORIES = [
  { value: 'tutoriales', label: 'Tutoriales' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'partidas', label: 'Partidas' },
  { value: 'comunidad', label: 'Comunidad' },
] as const

export type AdminVideo = {
  id: string
  title: string
  description: string | null
  youtube_url: string
  thumbnail_url: string | null
  category: string
  published: boolean
  created_by: string | null
  created_at: string
}

function extractYoutubeVideoId(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  const compact =
    /(?:youtube\.com\/watch\?(?:[^#]*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/.exec(
      s
    )
  if (compact?.[1]) return compact[1]
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`)
    if (u.hostname === 'youtu.be' || u.hostname.endsWith('.youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
      const segs = u.pathname.split('/').filter(Boolean)
      if (segs[0] === 'embed' && segs[1] && /^[a-zA-Z0-9_-]{11}$/.test(segs[1])) {
        return segs[1]
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

function thumbPreviewUrl(videoId: string | null): string | null {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export default function VideoForm({
  mode,
  video,
}: {
  mode: 'create' | 'edit'
  video?: AdminVideo | null
}) {
  const router = useRouter()
  const isEdit = mode === 'edit' && video

  const [youtubeUrl, setYoutubeUrl] = useState(video?.youtube_url ?? '')
  const [title, setTitle] = useState(video?.title ?? '')
  const [description, setDescription] = useState(video?.description ?? '')
  const [category, setCategory] = useState(
    video?.category && CATEGORIES.some((c) => c.value === video.category)
      ? video.category
      : 'tutoriales'
  )
  const [published, setPublished] = useState(video?.published ?? false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState<'draft' | 'publish' | null>(null)
  const [togglePending, setTogglePending] = useState(false)

  const previewId = extractYoutubeVideoId(youtubeUrl)
  const previewSrc = thumbPreviewUrl(previewId)

  const buildPayload = (publishedFlag: boolean): VideoInput => ({
    title,
    youtube_url: youtubeUrl.trim(),
    description: description.trim() || null,
    category,
    published: publishedFlag,
  })

  const submit = async (publishedFlag: boolean) => {
    setFormError(null)
    const action = publishedFlag ? 'publish' : 'draft'
    setPending(action)
    const payload = buildPayload(publishedFlag)
    try {
      if (mode === 'edit' && video) {
        const result = await updateVideo(video.id, payload)
        if ('error' in result && result.error) {
          setFormError(result.error)
          return
        }
        setPublished(publishedFlag)
      } else {
        const result = await createVideo(payload)
        if ('error' in result && result.error) {
          setFormError(result.error)
          return
        }
      }
      router.push('/admin/videos')
    } finally {
      setPending(null)
    }
  }

  const setVisibility = async (next: boolean) => {
    if (mode !== 'edit' || !video || published === next) return
    setTogglePending(true)
    setFormError(null)
    const result = await toggleVideoPublish(video.id, next)
    setTogglePending(false)
    if ('error' in result && result.error) {
      setFormError(result.error)
      return
    }
    setPublished(next)
  }

  return (
    <div className="max-w-3xl space-y-6" style={latoBody}>
      {formError && (
        <p className="text-sm text-[#CC4B37]" role="alert">
          {formError}
        </p>
      )}

      {isEdit && (
        <div className="flex flex-wrap items-center gap-4 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3">
          <span
            className="text-[0.65rem] tracking-[0.12em] text-[#666666]"
            style={jostHeading}
          >
            PUBLICADO / BORRADOR
          </span>
          <div
            className="flex border border-solid border-[#EEEEEE]"
            style={{ borderRadius: 2 }}
          >
            <button
              type="button"
              disabled={togglePending}
              onClick={() => void setVisibility(true)}
              className={`px-3 py-2 text-[0.65rem] tracking-[0.12em] transition-colors disabled:opacity-50 ${
                published
                  ? 'bg-[#CC4B37] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] text-[#666666] hover:text-[#111111]'
              }`}
              style={{ ...jostHeading, borderRadius: 0 }}
            >
              {togglePending && published ? '…' : 'PUBLICADO'}
            </button>
            <button
              type="button"
              disabled={togglePending}
              onClick={() => void setVisibility(false)}
              className={`border-l border-solid border-[#EEEEEE] px-3 py-2 text-[0.65rem] tracking-[0.12em] transition-colors disabled:opacity-50 ${
                !published
                  ? 'bg-[#EEEEEE] text-[#666666]'
                  : 'bg-[#FFFFFF] text-[#666666] hover:text-[#111111]'
              }`}
              style={{ ...jostHeading, borderRadius: 0 }}
            >
              {togglePending && !published ? '…' : 'BORRADOR'}
            </button>
          </div>
        </div>
      )}

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          URL DE YOUTUBE
        </label>
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className={inputClass}
          style={{ borderRadius: 2, ...latoBody }}
        />
        {previewSrc ? (
          <div className="mt-4 border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-2">
            <p
              className="mb-2 text-[0.6rem] tracking-[0.1em] text-[#666666]"
              style={jostHeading}
            >
              VISTA PREVIA MINIATURA
            </p>
            <div className="aspect-video max-w-md overflow-hidden border border-solid border-[#EEEEEE] bg-[#EEEEEE]">
              <img
                src={previewSrc}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          TÍTULO
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
          style={{ borderRadius: 2, ...latoBody }}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          DESCRIPCIÓN
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputClass}
          style={{ borderRadius: 2, ...latoBody, resize: 'vertical' }}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          CATEGORÍA
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
          style={{ borderRadius: 2, ...latoBody }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void submit(false)}
          className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CCCCCC] disabled:opacity-50"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          {pending === 'draft' ? 'GUARDANDO…' : 'GUARDAR BORRADOR'}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void submit(true)}
          className="border border-solid border-[#CC4B37] bg-[#CC4B37] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          {pending === 'publish' ? 'PUBLICANDO…' : 'PUBLICAR'}
        </button>
      </div>
    </div>
  )
}
