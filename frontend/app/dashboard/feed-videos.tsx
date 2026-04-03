import Link from 'next/link'
import { createDashboardSupabaseServerClient } from './supabase-server'

const jost = { fontFamily: "'Jost', sans-serif" } as const

type VideoRow = {
  id: string
  title: string
  youtube_url: string
  thumbnail_url: string | null
  category: string | null
  created_at: string
}

function PlayOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/75">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 7v10l8-5L9 7Z"
            fill="#111111"
            stroke="#111111"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

export function VideosSkeleton() {
  return (
    <section className="space-y-3">
      <div className="h-4 w-28 animate-pulse bg-[#F4F4F4]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-[#EEEEEE] md:border-b-0 pb-4 md:pb-0">
            <div className="relative aspect-video w-full animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 h-4 w-full animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 h-3 w-24 animate-pulse bg-[#F4F4F4]" />
          </div>
        ))}
      </div>
    </section>
  )
}

export async function VideosSection() {
  const supabase = createDashboardSupabaseServerClient()
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, youtube_url, thumbnail_url, category, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error || !data?.length) return null

  const videos = data as VideoRow[]

  return (
    <section className="space-y-3">
      <h2
        style={jost}
        className="text-[14px] uppercase tracking-widest font-extrabold text-[#666666]"
      >
        Videos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
        {videos.map((video, idx) => (
          <Link
            key={video.id}
            href={video.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block border-b border-[#EEEEEE] p-3 last:border-b-0 md:border-r md:border-[#EEEEEE] md:border-b-0 ${
              idx === videos.length - 1 ? 'md:border-r-0' : ''
            }`}
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
              <h3
                style={jost}
                className="mt-2 font-extrabold text-sm uppercase text-[#111111] leading-snug"
              >
                {video.title}
              </h3>
              {video.category ? (
                <p className="mt-1 text-[12px] text-[#666666]">{video.category}</p>
              ) : null}
            </article>
          </Link>
        ))}
      </div>
    </section>
  )
}
