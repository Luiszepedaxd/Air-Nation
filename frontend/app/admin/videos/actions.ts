'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'

export type VideoInput = {
  title: string
  youtube_url: string
  description: string | null
  category: string
  published: boolean
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

function thumbnailFromVideoId(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

export async function createVideo(
  data: VideoInput
): Promise<{ success: true; id: string } | { error: string }> {
  const title = data.title?.trim() ?? ''
  const youtubeUrl = data.youtube_url?.trim() ?? ''

  if (!title || !youtubeUrl) {
    return { error: 'Título y URL de YouTube son obligatorios' }
  }

  const videoId = extractYoutubeVideoId(youtubeUrl)
  if (!videoId) {
    return { error: 'URL de YouTube no válida' }
  }

  const authClient = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user?.id) {
    return { error: 'No autenticado' }
  }

  const supabase = createAdminClient()
  const thumbnail_url = thumbnailFromVideoId(videoId)

  const { data: inserted, error } = await supabase
    .from('videos')
    .insert({
      title,
      youtube_url: youtubeUrl,
      thumbnail_url,
      description: data.description?.trim() || null,
      category: data.category?.trim() || 'tutoriales',
      published: data.published,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/videos')
  return { success: true as const, id: inserted.id }
}

export async function updateVideo(
  id: string,
  data: VideoInput
): Promise<{ success: true } | { error: string }> {
  const title = data.title?.trim() ?? ''
  const youtubeUrl = data.youtube_url?.trim() ?? ''

  if (!title || !youtubeUrl) {
    return { error: 'Título y URL de YouTube son obligatorios' }
  }

  const videoId = extractYoutubeVideoId(youtubeUrl)
  if (!videoId) {
    return { error: 'URL de YouTube no válida' }
  }

  const supabase = createAdminClient()
  const thumbnail_url = thumbnailFromVideoId(videoId)

  const { error } = await supabase
    .from('videos')
    .update({
      title,
      youtube_url: youtubeUrl,
      thumbnail_url,
      description: data.description?.trim() || null,
      category: data.category?.trim() || 'tutoriales',
      published: data.published,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/videos')
  return { success: true as const }
}

export async function deleteVideo(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('videos').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/videos')
  return { success: true as const }
}

export async function toggleVideoPublish(
  id: string,
  published: boolean
): Promise<{ success: true } | { error: string }> {
  const supabase = createAdminClient()

  const { data: row, error: fetchErr } = await supabase
    .from('videos')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !row) {
    return { error: fetchErr?.message ?? 'Video no encontrado' }
  }

  const { error } = await supabase.from('videos').update({ published }).eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/videos')
  return { success: true as const }
}
