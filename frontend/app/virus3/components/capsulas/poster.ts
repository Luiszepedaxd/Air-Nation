import type { CapsulaItem } from '../../lib/types'

function uidStream(videoUrl: string): string | null {
  try {
    const u = new URL(videoUrl)
    const host = u.hostname.toLowerCase()
    const parts = u.pathname.split('/').filter(Boolean)
    if (host.includes('videodelivery.net') || host.includes('cloudflarestream.com')) {
      const uid = parts[0]
      return uid && uid !== 'manifest' ? uid : null
    }
    const manifestIdx = parts.indexOf('manifest')
    if (manifestIdx > 0) return parts[manifestIdx - 1] ?? null
  } catch {
    return null
  }
  return null
}

/** URL de poster o null si hay que usar fallback visual. */
export function posterDe(capsula: CapsulaItem): string | null {
  const poster = capsula.poster_url?.trim()
  if (poster && /^https?:\/\//i.test(poster)) return poster
  const video = capsula.video_url?.trim() ?? ''
  const uid = uidStream(video)
  if (uid) return `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg?time=3s&height=480`
  return null
}
