'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { deleteVideo } from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type VideoListItem = {
  id: string
  title: string
  thumbnail_url: string | null
  youtube_url: string
  category: string
  published: boolean
  created_at: string | null
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

function thumbnailSrc(v: VideoListItem): string {
  const t = v.thumbnail_url?.trim()
  if (t) return t
  const id = extractYoutubeVideoId(v.youtube_url)
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  return ''
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

function EstadoBadge({ published }: { published: boolean }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-wide"
      style={{
        padding: '4px 8px',
        borderRadius: 2,
        backgroundColor: published ? '#CC4B37' : '#EEEEEE',
        color: published ? '#FFFFFF' : '#666666',
        ...jostHeading,
        fontSize: 10,
      }}
    >
      {published ? 'PUBLICADO' : 'BORRADOR'}
    </span>
  )
}

export default function VideosList({
  videos: initialVideos,
}: {
  videos: VideoListItem[]
}) {
  const [videos, setVideos] = useState<VideoListItem[]>(initialVideos)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<VideoListItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setVideos(initialVideos)
  }, [initialVideos])

  const openDelete = (v: VideoListItem) => {
    setPendingDelete(v)
    setDeleteError(null)
  }

  const closeDelete = () => {
    if (deletingId) return
    setPendingDelete(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setDeletingId(pendingDelete.id)
    setDeleteError(null)
    const result = await deleteVideo(pendingDelete.id)
    setDeletingId(null)
    if ('error' in result && result.error) {
      setDeleteError(result.error)
      return
    }
    setVideos((prev) => prev.filter((v) => v.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  if (videos.length === 0) {
    return (
      <p className="py-16 text-center text-[#666666]" style={latoBody}>
        No hay videos aún
      </p>
    )
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      style={latoBody}
    >
      {videos.map((v) => {
        const src = thumbnailSrc(v)
        return (
          <article
            key={v.id}
            className="border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-[#EEEEEE]">
              {src ? (
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[#666666]">
                  Sin miniatura
                </div>
              )}
            </div>
            <div className="border-t border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <EstadoBadge published={v.published} />
              </div>
              <h2
                className="mb-2 line-clamp-2 text-base tracking-[0.08em] text-[#111111]"
                style={jostHeading}
              >
                {v.title}
              </h2>
              <p className="mb-4 text-sm text-[#666666]">
                {v.category} · {formatFecha(v.created_at)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/videos/${v.id}/editar`}
                  className="inline-flex items-center justify-center bg-[#111111] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                  style={{
                    ...jostHeading,
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 2,
                  }}
                >
                  EDITAR
                </Link>
                <button
                  type="button"
                  disabled={deletingId === v.id}
                  onClick={() => openDelete(v)}
                  className="border border-[#CC4B37] px-3 py-1.5 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#CC4B37] transition-colors hover:bg-[#CC4B37] hover:text-white disabled:opacity-50"
                  style={{ borderRadius: 2 }}
                >
                  {deletingId === v.id ? '…' : 'ELIMINAR'}
                </button>
              </div>
            </div>
          </article>
        )
      })}

      <DeleteConfirmModal
        open={pendingDelete !== null}
        resourceLabel={pendingDelete?.title ?? ''}
        loading={pendingDelete !== null && deletingId === pendingDelete.id}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
