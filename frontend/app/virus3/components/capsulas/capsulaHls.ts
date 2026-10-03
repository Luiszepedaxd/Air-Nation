/** HLS: manifiesto .m3u8 propio o de Cloudflare Stream. */
export function isHlsUrl(url: string): boolean {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  if (clean.endsWith('.m3u8')) return true
  return (
    clean.includes('m3u8') &&
    (clean.includes('videodelivery.net') || clean.includes('cloudflarestream.com'))
  )
}

export function supportsNativeHls(video: HTMLVideoElement): boolean {
  return Boolean(video.canPlayType('application/vnd.apple.mpegurl'))
}

let hlsChunk: Promise<typeof import('hls.js')> | null = null

export function preloadHlsJs() {
  if (!hlsChunk) hlsChunk = import('hls.js')
  return hlsChunk
}

export async function getHlsConstructor() {
  const mod = await preloadHlsJs()
  return mod.default
}
