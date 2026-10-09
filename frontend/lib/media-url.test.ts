import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { clampFeedAspect, feedBlurSrc, FEED_MIN_ASPECT, FEED_MAX_ASPECT } from './media-url.ts'

describe('feed photo frame', () => {
  it('acota la proporción entre 4:5 y 1.91:1', () => {
    assert.equal(clampFeedAspect(1000, 1000), 1)
    assert.equal(clampFeedAspect(800, 1000), FEED_MIN_ASPECT)
    assert.equal(clampFeedAspect(400, 1000), FEED_MIN_ASPECT)
    assert.equal(clampFeedAspect(1910, 1000), FEED_MAX_ASPECT)
    assert.equal(clampFeedAspect(4000, 1000), FEED_MAX_ASPECT)
    assert.ok(Math.abs(clampFeedAspect(1600, 900) - 16 / 9) < 0.001)
  })

  it('pide el fondo borroso chico en Cloudflare y deja igual el resto', () => {
    const cf = 'https://imagedelivery.net/acc/imgid/public'
    assert.equal(
      feedBlurSrc(cf),
      'https://imagedelivery.net/acc/imgid/w=48,f=auto,q=30,fit=scale-down'
    )
    assert.equal(feedBlurSrc('https://example.com/a.jpg'), 'https://example.com/a.jpg')
  })
})
