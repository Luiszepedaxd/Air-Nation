'use client'

import { useState } from 'react'
import { VideoModal } from './VideoModal'

const jost = { fontFamily: "'Jost', sans-serif" } as const

export type VideoFeedItem = {
  id: string
  title: string
  youtube_url: string
  thumbnail_url: string | null
  category: string | null
  created_at: string
}

/** Misma lógica que `extractYoutubeVideoId` en `admin/videos/VideoForm.tsx`. */
function extractYoutubeId(raw: string): string | null {
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

function PlayOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M4 3v8l7-4L4 3Z" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  )
}

export function VideosFeedCards({ videos }: { videos: VideoFeedItem[] }) {
  const [selectedVideo, setSelectedVideo] = useState<{
    id: string
    title: string
  } | null>(null)

  return (
    <>
      {videos.map((video) => (
        <div
          key={video.id}
          role="button"
          tabIndex={0}
          onClick={() => {
            const id = extractYoutubeId(video.youtube_url)
            if (id) setSelectedVideo({ id, title: video.title })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              const id = extractYoutubeId(video.youtube_url)
              if (id) setSelectedVideo({ id, title: video.title })
            }
          }}
          className="w-[260px] shrink-0 cursor-pointer snap-start border border-[#EEEEEE] bg-[#FFFFFF] md:w-[300px]"
        >
          <article>
            <div className="relative aspect-video w-full overflow-hidden bg-[#F4F4F4]">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
              <PlayOverlay />
            </div>
            <div className="px-2 pb-2">
              <h3
                style={jost}
                className="mt-2 line-clamp-2 text-[12px] font-extrabold uppercase leading-snug text-[#111111]"
              >
                {video.title}
              </h3>
              {video.category ? (
                <p className="mt-1 text-[11px] text-[#666666]">{video.category}</p>
              ) : null}
            </div>
          </article>
        </div>
      ))}
      {selectedVideo ? (
        <VideoModal
          videoId={selectedVideo.id}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      ) : null}
    </>
  )
}
