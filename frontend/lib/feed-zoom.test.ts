import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clampFeedZoom,
  zoomKeepingPoint,
  FEED_ZOOM_DOUBLE,
  FEED_ZOOM_MAX,
} from './feed-zoom.ts'

describe('feed lightbox zoom', () => {
  it('no deja pan con la foto a tamaño normal', () => {
    assert.deepEqual(clampFeedZoom(1, 40, -20, 200, 300), { scale: 1, x: 0, y: 0 })
    assert.deepEqual(clampFeedZoom(0.4, 10, 10, 200, 300), { scale: 1, x: 0, y: 0 })
  })

  it('acota el paneo al borde de la foto ampliada', () => {
    // scale 2 sobre 100×80 → ±50 en x, ±40 en y
    assert.deepEqual(clampFeedZoom(2, 80, -90, 100, 80), { scale: 2, x: 50, y: -40 })
    assert.equal(clampFeedZoom(9, 0, 0, 100, 100).scale, FEED_ZOOM_MAX)
  })

  it('el doble toque deja el punto tocado quieto', () => {
    const z = zoomKeepingPoint(
      { scale: 1, x: 0, y: 0 },
      FEED_ZOOM_DOUBLE,
      20,
      -10,
      20,
      -10,
      200,
      400,
    )
    // punto local (20, -10) a escala 2 aparece otra vez en (20, -10)
    const lx = 20
    const ly = -10
    assert.equal(lx * z.scale + z.x, 20)
    assert.equal(ly * z.scale + z.y, -10)
    assert.equal(z.scale, 2)
  })

  it('el pellizco sigue al punto medio aunque se mueva', () => {
    const start = { scale: 1, x: 0, y: 0 }
    const z = zoomKeepingPoint(start, 2, 0, 0, 30, 10, 400, 400)
    // el punto que estaba en el centro sigue bajo el nuevo punto medio
    assert.equal(0 * z.scale + z.x, 30)
    assert.equal(0 * z.scale + z.y, 10)
  })
})
