import Link from 'next/link'
import { createDashboardSupabaseServerClient } from './supabase-server'
import { Carrusel } from './components/Carrusel'
import { SectionHeader } from './components/SectionHeader'

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
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M4 3v8l7-4L4 3Z" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  )
}

export function VideosSkeleton() {
  return (
    <section>
      <div className="w-full border-t border-[#EEEEEE]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:mx-auto md:max-w-[1200px] md:px-6">
          <div className="h-4 w-24 animate-pulse bg-[#F4F4F4]" />
          <div className="h-3 w-24 animate-pulse bg-[#F4F4F4]" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 pt-1 md:px-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-[260px] shrink-0 border border-[#EEEEEE] md:w-[300px]"
          >
            <div className="relative aspect-video w-full animate-pulse bg-[#F4F4F4]" />
            <div className="px-2 pb-2 pt-0">
              <div className="mt-2 h-3.5 w-full animate-pulse bg-[#F4F4F4]" />
              <div className="mt-1 h-2.5 w-20 animate-pulse bg-[#F4F4F4]" />
            </div>
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
    <section>
      <SectionHeader title="VIDEOS" href="/videos" />
      <Carrusel>
        {videos.map((video) => (
          <Link
            key={video.id}
            href={video.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-[260px] shrink-0 snap-start border border-[#EEEEEE] bg-[#FFFFFF] md:w-[300px]"
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
          </Link>
        ))}
      </Carrusel>
    </section>
  )
}
