import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import {
  isCompleted,
  markCompleted,
  parseProgressValue,
  readProgress,
  resetProgress,
  savePosition,
  serializeProgress,
  type CapsulasProgress,
} from './progreso-capsulas.ts'

const VACIO: CapsulasProgress = { v: 1, c: [], p: {} }

let jar = ''
let ultima = ''
const loc = { protocol: 'https:' }

function instalarDocumento() {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      get cookie() {
        return jar
      },
      set cookie(valor: string) {
        ultima = valor
        const par = valor.split(';')[0].trim()
        const i = par.indexOf('=')
        const nombre = par.slice(0, i)
        const resto = jar
          .split(';')
          .map((p) => p.trim())
          .filter((p) => p && p.slice(0, p.indexOf('=')) !== nombre)
        resto.push(par)
        jar = resto.join('; ')
      },
    },
  })
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: loc,
  })
}

describe('parseProgressValue', () => {
  it('tolera cookie ausente, corrupta o de otra versión', () => {
    assert.deepEqual(parseProgressValue(null), VACIO)
    assert.deepEqual(parseProgressValue(''), VACIO)
    assert.deepEqual(parseProgressValue('%7B'), VACIO)
    assert.deepEqual(parseProgressValue(encodeURIComponent('no-json')), VACIO)
    assert.deepEqual(
      parseProgressValue(encodeURIComponent(JSON.stringify({ v: 2, c: ['a'], p: { a: 1 } }))),
      VACIO
    )
  })

  it('quita posiciones de cápsulas ya completadas', () => {
    const raw = encodeURIComponent(JSON.stringify({ v: 1, c: ['c06'], p: { c06: 12, c07: 4 } }))
    assert.deepEqual(parseProgressValue(raw), { v: 1, c: ['c06'], p: { c07: 4 } })
  })
})

describe('serializeProgress', () => {
  it('recorta posiciones si el JSON pasa de 3500 y nunca pierde completadas', () => {
    const c = Array.from({ length: 30 }, (_, i) => `c${i}`)
    const p: Record<string, number> = {}
    for (let i = 0; i < 200; i++) p[`${'posicion'.repeat(4)}_${i}`] = i + 1
    const enorme: CapsulasProgress = { v: 1, c, p }
    assert.ok(JSON.stringify(enorme).length > 3500)

    const parsed = parseProgressValue(serializeProgress(enorme))
    assert.deepEqual(parsed.c, c)
    assert.ok(Object.keys(parsed.p).length < 200)
    assert.ok(JSON.stringify({ v: 1, c: parsed.c, p: parsed.p }).length <= 3500)
  })

  it('si solo las completadas ya superan 3500, las conserva todas', () => {
    const c = Array.from({ length: 80 }, (_, i) => 'c' + 'x'.repeat(50) + i)
    assert.ok(JSON.stringify({ v: 1, c, p: {} }).length > 3500)
    const parsed = parseProgressValue(serializeProgress({ v: 1, c, p: { sobra: 3 } }))
    assert.deepEqual(parsed.c, c)
    assert.deepEqual(parsed.p, {})
  })
})

describe('cookie an_v3_capsulas', () => {
  beforeEach(() => {
    jar = ''
    ultima = ''
    loc.protocol = 'https:'
    instalarDocumento()
  })

  it('marca completa, guarda posición y la borra al completar', () => {
    assert.deepEqual(readProgress(), VACIO)
    const aMedias = savePosition('c06', 12.4)
    assert.deepEqual(aMedias.p.c06, 12)
    assert.equal(isCompleted(aMedias, 'c06'), false)

    const hecha = markCompleted('c06')
    assert.equal(isCompleted(hecha, 'c06'), true)
    assert.equal(hecha.p.c06, undefined)
    assert.equal(savePosition('c06', 8).p.c06, undefined)

    const otra = savePosition('c07', 3)
    assert.deepEqual(otra.c, ['c06'])
    assert.equal(otra.p.c07, 3)
  })

  it('escribe path, max-age, SameSite y Secure solo en https', () => {
    resetProgress()
    assert.match(ultima, /^an_v3_capsulas=/)
    assert.match(ultima, /path=\//)
    assert.match(ultima, /max-age=31536000/)
    assert.match(ultima, /SameSite=Lax/)
    assert.match(ultima, /;\s*Secure/)

    loc.protocol = 'http:'
    resetProgress()
    assert.equal(ultima.includes('Secure'), false)
  })

  it('reiniciar deja la cookie vacía y sobrevive a un valor corrupto', () => {
    markCompleted('c01')
    assert.deepEqual(resetProgress(), VACIO)
    assert.deepEqual(readProgress(), VACIO)

    document.cookie = 'an_v3_capsulas=' + encodeURIComponent('{roto') + '; path=/'
    assert.deepEqual(readProgress(), VACIO)
  })
})
