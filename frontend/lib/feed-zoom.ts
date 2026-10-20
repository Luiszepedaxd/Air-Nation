/** Pinch / double-tap zoom for the feed lightbox. Pure math, no DOM. */

export const FEED_ZOOM_MIN = 1
export const FEED_ZOOM_MAX = 4
export const FEED_ZOOM_DOUBLE = 2

export type FeedZoom = { scale: number; x: number; y: number }

export const FEED_ZOOM_RESET: FeedZoom = { scale: 1, x: 0, y: 0 }

export function clampFeedZoom(
  scale: number,
  x: number,
  y: number,
  width: number,
  height: number,
): FeedZoom {
  const s = Math.min(FEED_ZOOM_MAX, Math.max(FEED_ZOOM_MIN, scale))
  if (s <= 1 || !(width > 0) || !(height > 0)) return FEED_ZOOM_RESET
  const maxX = ((s - 1) * width) / 2
  const maxY = ((s - 1) * height) / 2
  return {
    scale: s,
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  }
}

/**
 * Keep the image point that started under (startFx, startFy) under (fx, fy)
 * after a scale change. Offsets are pixels from the visual center.
 * Double-tap passes the same point twice; a pinch passes the moving midpoint.
 */
export function zoomKeepingPoint(
  start: FeedZoom,
  nextScale: number,
  startFx: number,
  startFy: number,
  fx: number,
  fy: number,
  width: number,
  height: number,
): FeedZoom {
  const s1 = Math.min(FEED_ZOOM_MAX, Math.max(FEED_ZOOM_MIN, nextScale))
  const s0 = start.scale > 0 ? start.scale : 1
  const lx = (startFx - start.x) / s0
  const ly = (startFy - start.y) / s0
  return clampFeedZoom(s1, fx - lx * s1, fy - ly * s1, width, height)
}
