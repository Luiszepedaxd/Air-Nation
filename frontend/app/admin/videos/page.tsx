export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '../supabase-server'
import VideosList, { type VideoListItem } from './VideosList'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminVideosPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url, youtube_url, category, published, created_at')
    .order('created_at', { ascending: false })

  const videos: VideoListItem[] =
    !error && data ? (data as VideoListItem[]) : []

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          VIDEOS
        </h1>
        <Link
          href="/admin/videos/nuevo"
          className="inline-flex items-center justify-center border border-solid border-[#EEEEEE] bg-[#CC4B37] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          NUEVO VIDEO
        </Link>
      </div>
      <VideosList videos={videos} />
    </div>
  )
}
