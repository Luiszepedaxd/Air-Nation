import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  replicaRegistrationPhotos,
  resolveImageKind,
  shouldTranscode,
} from './replica-photo.ts'

function bytes(...xs: number[]): Uint8Array {
  return Uint8Array.from(xs)
}

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46)
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
const WEBP = bytes(
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
)
const HEIC = bytes(
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63
)
const PDF = bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34)

describe('replica registration feed post', () => {
  it('does not publish when the photo never landed', () => {
    assert.equal(replicaRegistrationPhotos(null), null)
    assert.equal(replicaRegistrationPhotos(''), null)
    assert.equal(replicaRegistrationPhotos('   '), null)
    assert.equal(replicaRegistrationPhotos('not-a-url'), null)
    assert.equal(replicaRegistrationPhotos('blob:https://airnation.mx/abc'), null)
  })

  it('publishes only a real http(s) image url', () => {
    assert.deepEqual(
      replicaRegistrationPhotos('  https://imagedelivery.net/a/b/public  '),
      ['https://imagedelivery.net/a/b/public']
    )
  })
})

describe('replica photo formats', () => {
  it('accepts jpeg, png and webp even when the iPhone sends an empty mime', () => {
    assert.equal(resolveImageKind({ type: '', name: 'IMG_2048.JPG', bytes: JPEG }), 'jpeg')
    assert.equal(resolveImageKind({ type: '', name: 'foto.png', bytes: PNG }), 'png')
    assert.equal(resolveImageKind({ type: '', name: 'foto.webp', bytes: WEBP }), 'webp')
    assert.equal(resolveImageKind({ type: '', name: 'image', bytes: JPEG }), 'jpeg')
  })

  it('treats HEIC as HEIC, including a file mislabeled as jpeg', () => {
    assert.equal(
      resolveImageKind({ type: '', name: 'IMG_2048.HEIC', bytes: HEIC }),
      'heic'
    )
    assert.equal(
      resolveImageKind({ type: 'image/heic', name: 'foto.jpg', bytes: HEIC }),
      'heic'
    )
    assert.equal(
      resolveImageKind({ type: 'image/jpeg', name: 'foto.jpg', bytes: HEIC }),
      'heic'
    )
    assert.equal(resolveImageKind({ type: 'image/heif', name: 'foto' }), 'heic')
    const mif1 = bytes(0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31)
    assert.equal(resolveImageKind({ type: '', name: 'IMG.HEIF', bytes: mif1 }), 'heic')
    assert.equal(shouldTranscode('heic', 120_000), true)
  })

  it('rejects formats that are not photos, even if labeled jpeg', () => {
    assert.equal(resolveImageKind({ type: 'application/pdf', name: 'doc.pdf', bytes: PDF }), null)
    assert.equal(resolveImageKind({ type: 'image/jpeg', name: 'foto.jpg', bytes: PDF }), null)
    assert.equal(resolveImageKind({ type: '', name: 'clip.mp4', bytes: bytes(0, 0, 0, 24) }), null)
  })

  it('recompresses only oversized jpeg/png/webp', () => {
    assert.equal(shouldTranscode('jpeg', 2 * 1024 * 1024), false)
    assert.equal(shouldTranscode('png', 9 * 1024 * 1024), true)
    assert.equal(shouldTranscode('webp', 8 * 1024 * 1024), false)
    assert.equal(shouldTranscode('webp', 8 * 1024 * 1024 + 1), true)
  })
})
