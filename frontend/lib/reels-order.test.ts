import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { orderReels, recycleReels, reelScore, type ReelRankInput } from './reels-order.ts'

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

/** Semilla fija: el orden de una sesión tiene que poder repetirse en el test. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('reelScore', () => {
  it('prefiere lo reciente con el mismo engagement', () => {
    assert.ok(reelScore(reel('a', 'u1', 0), NOW) > reelScore(reel('b', 'u2', 10), NOW))
  })

  it('prefiere más engagement con la misma fecha', () => {
    assert.ok(reelScore(reel('a', 'u1', 3, 20, 5), NOW) > reelScore(reel('b', 'u2', 3, 0, 0), NOW))
  })

  it('no explota con fechas inválidas', () => {
    const score = reelScore({ ...reel('a', 'u1', 0), createdAt: 'no-es-fecha' }, NOW)
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

  it('un roll alto adelanta un video viejo; sin azar manda el puntaje', () => {
    // 30 días de recencia valen más que el ruido de 0.5 que antes no movía nada.
    const items = [reel('fresh', 'u1', 0), reel('old', 'u2', 30)]
    assert.equal(orderReels(items, { now: NOW, random: () => 0 })[0].key, 'fresh')
    assert.equal(orderReels(items, { now: NOW, random: () => 0.99 })[0].key, 'old')
  })

  it('cada semilla puede dar un orden distinto', () => {
    const items = [
      reel('a', 'u1', 0),
      reel('b', 'u2', 10),
      reel('c', 'u3', 20),
      reel('d', 'u4', 30),
    ]
    const orders = new Set<string>()
    for (let seed = 1; seed <= 24; seed++) {
      orders.add(
        orderReels(items, { now: NOW, random: mulberry32(seed) })
          .map((item) => item.key)
          .join(',')
      )
    }
    assert.ok(orders.size > 1)
  })

  it('lo reciente sigue saliendo antes que lo viejo', () => {
    const items = [reel('old', 'u1', 30), reel('fresh', 'u2', 0)]
    let freshFirst = 0
    const trials = 80
    for (let seed = 1; seed <= trials; seed++) {
      const out = orderReels(items, { now: NOW, random: mulberry32(seed) })
      if (out[0].key === 'fresh') freshFirst++
    }
    assert.ok(freshFirst > trials * 0.65)
    assert.ok(freshFirst < trials)
  })

  it('una apertura nueva no hereda los vistos: sin seen vuelve el catálogo', () => {
    const items = [reel('a', 'u1', 0), reel('b', 'u2', 1), reel('c', 'u3', 5)]
    const seen = new Set(items.map((item) => item.key))
    assert.equal(orderReels(items, { now: NOW, seen, random: noRandom }).length, 0)
    assert.deepEqual(
      orderReels(items, { now: NOW, random: noRandom }).map((item) => item.key),
      ['a', 'b', 'c']
    )
  })

  it('al agotar el pool recicla sin repetir el video ni el autor en pantalla', () => {
    const items = [reel('a1', 'u1', 0), reel('a2', 'u1', 1), reel('b1', 'u2', 2)]
    const out = recycleReels([...items, items[0]], 'a1', { now: NOW, random: noRandom })
    assert.deepEqual(
      out.map((item) => item.key).sort(),
      ['a2', 'b1']
    )
    assert.notEqual(out[0].authorId, 'u1')
  })

  it('separa autores también cuando el azar reordena', () => {
    const items = [
      reel('a1', 'u1', 0),
      reel('a2', 'u1', 1),
      reel('b1', 'u2', 2),
      reel('b2', 'u2', 3),
    ]
    for (let seed = 1; seed <= 40; seed++) {
      const out = orderReels(items, { now: NOW, random: mulberry32(seed) })
      for (let i = 1; i < out.length; i++) {
        assert.notEqual(out[i].authorId, out[i - 1].authorId)
      }
    }
  })
})
