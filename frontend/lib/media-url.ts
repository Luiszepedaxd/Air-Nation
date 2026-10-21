/**
 * Cloudflare Images (imagedelivery.net) URL helpers for feed-sized delivery.
 * Flexible variants: replace named variant with w=N,f=auto,q=…
 * If flexible variants are disabled on the CF account, callers should onError → original.
 */

export function isCloudflareImagesUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.hostname === 'imagedelivery.net'
  } catch {
    return false
  }
}

type CfOpts = {
  width: number
  quality?: number
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad'
}

/** Rewrite imagedelivery.net …/<id>/<variant> → flexible size variant. */
export function cfImageDeliveryUrl(
  url: string | null | undefined,
  opts: CfOpts
): string {
  if (!url) return ''
  const m = url.match(
    /^(https:\/\/imagedelivery\.net\/[^/]+\/[^/]+)\/([^/?#]+)([?#].*)?$/i
  )
  if (!m) return url
  const base = m[1]
  const qs = m[3] ?? ''
  const q = opts.quality ?? 75
  const parts = [`w=${Math.max(1, Math.round(opts.width))}`, 'f=auto', `q=${q}`]
  if (opts.fit) parts.push(`fit=${opts.fit}`)
  return `${base}/${parts.join(',')}${qs}`
}

/** Instagram-style feed frame: no taller than 4:5, no wider than 1.91:1. */
export const FEED_MIN_ASPECT = 4 / 5
export const FEED_MAX_ASPECT = 1.91

export function clampFeedAspect(width: number, height: number): number {
  if (!width || !height) return 1
  const ratio = width / height
  return Math.min(FEED_MAX_ASPECT, Math.max(FEED_MIN_ASPECT, ratio))
}

/** Caja del video en el feed. El cuadro del video gana; si todavía es 0×0, el poster. */
export function feedVideoBoxAspect(
  videoW: number,
  videoH: number,
  posterW = 0,
  posterH = 0,
): number | null {
  if (videoW > 0 && videoH > 0) return clampFeedAspect(videoW, videoH)
  if (posterW > 0 && posterH > 0) return clampFeedAspect(posterW, posterH)
  return null
}

const FEED_WIDTHS = [400, 828, 1200] as const

export function feedPhotoSrcSet(url: string): {
  src: string
  srcSet: string
  sizes: string
  original: string
} {
  const original = url
  if (!isCloudflareImagesUrl(url)) {
    return {
      src: url,
      srcSet: '',
      sizes: '(max-width: 640px) 100vw, 640px',
      original,
    }
  }
  const srcSet = FEED_WIDTHS.map(
    (w) => `${cfImageDeliveryUrl(url, { width: w, quality: 75, fit: 'scale-down' })} ${w}w`
  ).join(', ')
  return {
    src: cfImageDeliveryUrl(url, { width: 828, quality: 75, fit: 'scale-down' }),
    srcSet,
    sizes: '(max-width: 640px) 100vw, 640px',
    original,
  }
}

export function feedAvatarUrl(
  url: string | null | undefined,
  size = 96
): string {
  if (!url) return ''
  if (!isCloudflareImagesUrl(url)) return url
  return cfImageDeliveryUrl(url, {
    width: size * 2,
    quality: 70,
    fit: 'cover',
  })
}

export function lightboxImageUrl(url: string): string {
  if (!isCloudflareImagesUrl(url)) return url
  return cfImageDeliveryUrl(url, { width: 1600, quality: 82 })
}
