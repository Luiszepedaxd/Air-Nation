import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { orderReels, reelScore, type ReelRankInput } from './reels-order.ts'

const NOW = Date.parse('2026-10-20T12:00:00.000Z')
const DAY = 86_400_000

function reel(
  key: string,
  authorId: string,
  ageDays: number,
  likeCount = 0,
  commentCount = 0
): ReelRankInput {
  return {
    key,
    authorId,
    createdAt: new Date(NOW - ageDays * DAY).toISOString(),
    likeCount,
    commentCount,
  }
}

/** Sin azar: el orden depende solo de recencia + engagement. */
const noRandom = () => 0

describe('reelScore', () => {
  it('prefiere lo reciente con el mismo engagement', () => {
    assert.ok(reelScore(reel('a', 'u1', 0), NOW, 0) > reelScore(reel('b', 'u2', 10), NOW, 0))
  })

  it('prefiere más engagement con la misma fecha', () => {
    assert.ok(
      reelScore(reel('a', 'u1', 3, 20, 5), NOW, 0) > reelScore(reel('b', 'u2', 3, 0, 0), NOW, 0)
    )
  })

  it('no explota con fechas inválidas', () => {
    const score = reelScore({ ...reel('a', 'u1', 0), createdAt: 'no-es-fecha' }, NOW, 0)
    assert.ok(Number.isFinite(score))
  })
})

describe('orderReels', () => {
  it('ordena por puntaje y descarta lo visto', () => {
    const items = [reel('a', 'u1', 30), reel('b', 'u2', 0), reel('c', 'u3', 10)]
    const out = orderReels(items, { now: NOW, random: noRandom })
    assert.deepEqual(out.map((i) => i.key), ['b', 'c', 'a'])

    const sinVistos = orderReels(items, {
      now: NOW,
      random: noRandom,
      seen: new Set(['b']),
    })
    assert.deepEqual(sinVistos.map((i) => i.key), ['c', 'a'])
  })

  it('no deja dos seguidos del mismo autor si hay alternativa', () => {
    const items = [
      reel('a1', 'u1', 0),
      reel('a2', 'u1', 1),
      reel('a3', 'u1', 2),
      reel('b1', 'u2', 3),
    ]
    const out = orderReels(items, { now: NOW, random: noRandom })
    assert.deepEqual(out.map((i) => i.key), ['a1', 'b1', 'a2', 'a3'])
    assert.equal(out.length, items.length)
  })

  it('conserva todos los items cuando un solo autor tiene todo', () => {
    const items = [reel('a1', 'u1', 0), reel('a2', 'u1', 1)]
    const out = orderReels(items, { now: NOW, random: noRandom })
    assert.deepEqual(out.map((i) => i.key), ['a1', 'a2'])
  })

  it('el azar puede alterar el orden', () => {
    const items = [reel('a', 'u1', 0), reel('b', 'u2', 2)]
    const flipped = orderReels(items, {
      now: NOW,
      // 0 para el primero, 1 para el segundo: el azar vence a la recencia.
      random: (() => {
        let n = 0
        return () => (n++ === 0 ? 0 : 1)
      })(),
    })
    assert.deepEqual(flipped.map((i) => i.key), ['b', 'a'])
  })
})
