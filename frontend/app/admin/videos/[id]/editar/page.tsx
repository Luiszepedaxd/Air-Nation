import { redirect } from 'next/navigation'
import { createAdminClient } from '../../../supabase-server'
import VideoForm, { type AdminVideo } from '../../VideoForm'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function EditarVideoPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('videos')
    .select(
      'id, title, description, youtube_url, thumbnail_url, category, published, created_by, created_at'
    )
    .eq('id', params.id)
    .maybeSingle()

  if (error || !data) {
    redirect('/admin/videos')
  }

  const video = data as AdminVideo

  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        EDITAR VIDEO
      </h1>
      <VideoForm key={video.id} mode="edit" video={video} />
    </div>
  )
}
