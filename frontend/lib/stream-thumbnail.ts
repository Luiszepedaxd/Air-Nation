/**
 * Thumbnail JPG de un video de Cloudflare Stream, derivado del manifiesto HLS
 * (mismo origen, así que hereda el customer subdomain). Devuelve null si el
 * src no es de Stream (R2 legacy: el poster vive en `thumbnail_url`).
 */
export function streamThumbnail(src: string, height: number, time = '0s'): string | null {
  try {
    const url = new URL(src)
    const host = url.hostname.toLowerCase()
    if (!host.includes('cloudflarestream.com') && !host.includes('videodelivery.net')) return null
    const uid = url.pathname.split('/').filter(Boolean)[0]
    if (!uid || uid === 'manifest') return null
    return `${url.origin}/${uid}/thumbnails/thumbnail.jpg?time=${time}&height=${height}`
  } catch {
    return null
  }
}
