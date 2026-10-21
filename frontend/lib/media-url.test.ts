import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clampFeedAspect, feedVideoBoxAspect, FEED_MIN_ASPECT, FEED_MAX_ASPECT } from './media-url.ts'

describe('feed photo frame', () => {
  it('acota la proporción entre 4:5 y 1.91:1', () => {
    assert.equal(clampFeedAspect(1000, 1000), 1)
    assert.equal(clampFeedAspect(800, 1000), FEED_MIN_ASPECT)
    assert.equal(clampFeedAspect(400, 1000), FEED_MIN_ASPECT)
    assert.equal(clampFeedAspect(1910, 1000), FEED_MAX_ASPECT)
    assert.equal(clampFeedAspect(4000, 1000), FEED_MAX_ASPECT)
    assert.ok(Math.abs(clampFeedAspect(1600, 900) - 16 / 9) < 0.001)
  })

  it('el video manda sobre el poster; sin tamaño, el poster; si no hay nada, null', () => {
    assert.equal(feedVideoBoxAspect(1080, 1920, 100, 100), FEED_MIN_ASPECT)
    assert.ok(Math.abs((feedVideoBoxAspect(1920, 1080) ?? 0) - 16 / 9) < 0.001)
    assert.equal(feedVideoBoxAspect(0, 0, 1080, 1920), FEED_MIN_ASPECT)
    assert.ok(Math.abs((feedVideoBoxAspect(0, 0, 1920, 1080) ?? 0) - 16 / 9) < 0.001)
    assert.equal(feedVideoBoxAspect(0, 0), null)
    assert.equal(feedVideoBoxAspect(4000, 1000), FEED_MAX_ASPECT)
  })
})
