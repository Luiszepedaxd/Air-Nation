import { supabase } from '@/lib/supabase'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

/**
 * Fetch autenticado al backend Express.
 * Agrega automáticamente Authorization: Bearer <JWT de Supabase>.
 * Usa el mismo API_URL base que el resto del proyecto.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const token = session?.access_token ?? null

  const headers = new Headers(options.headers)
  if (options.body instanceof FormData) {
    headers.delete('Content-Type')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${API_URL}${path}`, { ...options, headers })
}

/**
 * Shortcut para subir un archivo a /upload.
 * Devuelve la URL pública del archivo subido.
 */
export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await apiFetch('/upload', { method: 'POST', body: fd })
  const json = await res.json() as { url?: string; error?: string }
  if (!res.ok) throw new Error(json.error || 'Error al subir archivo')
  if (!json.url) throw new Error('Respuesta inválida del servidor')
  return json.url
}

export type VideoUploadResult = {
  video_url: string
  thumbnail_url: string | null
  duration_s: number
}

/** Sube un video a Cloudflare Stream (POST /upload/video). */
export async function uploadVideo(file: File): Promise<VideoUploadResult> {
  const formData = new FormData()
  formData.append('file', file, file.name)
  const res = await apiFetch('/upload/video', { method: 'POST', body: formData })
  const json = (await res.json()) as {
    video_url?: string
    thumbnail_url?: string | null
    duration_s?: number
    error?: string
  }
  if (!res.ok) {
    throw new Error(json.error || 'Error al subir el video')
  }
  if (!json.video_url) {
    throw new Error('Respuesta inválida del servidor (video)')
  }
  return {
    video_url: json.video_url,
    thumbnail_url: json.thumbnail_url ?? null,
    duration_s: typeof json.duration_s === 'number' ? json.duration_s : 0,
  }
}
