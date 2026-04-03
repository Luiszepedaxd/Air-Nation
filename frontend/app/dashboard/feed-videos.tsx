import { createDashboardSupabaseServerClient } from './supabase-server'
import { Carrusel } from './components/Carrusel'
import { SectionHeader } from './components/SectionHeader'
import { VideosFeedCards, type VideoFeedItem } from './components/VideosFeedCards'

type VideoRow = VideoFeedItem

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
        <VideosFeedCards videos={videos} />
      </Carrusel>
    </section>
  )
}
