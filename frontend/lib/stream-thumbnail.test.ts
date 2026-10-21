import assert from 'node:assert/strict'
import { test } from 'node:test'
import { streamThumbnail } from './stream-thumbnail.ts'

test('stream manifest → thumbnail del mismo origen', () => {
  assert.equal(
    streamThumbnail('https://customer-abc.cloudflarestream.com/uid123/manifest/video.m3u8', 630, '1s'),
    'https://customer-abc.cloudflarestream.com/uid123/thumbnails/thumbnail.jpg?time=1s&height=630'
  )
})

test('no-Stream, url inválida y path sin uid → null', () => {
  assert.equal(streamThumbnail('https://pub-x.r2.dev/algo-clip.mp4', 630), null)
  assert.equal(streamThumbnail('no-es-url', 630), null)
  assert.equal(streamThumbnail('https://customer-abc.cloudflarestream.com/manifest/video.m3u8', 630), null)
})
