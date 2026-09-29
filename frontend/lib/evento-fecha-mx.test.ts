import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mxLocalToIso, isoToMxLocal, formatEventoFechaCorta } from '../app/eventos/lib/format-evento-fecha.ts'

describe('mxLocalToIso', () => {
  it('interprets datetime-local as Mexico City (-06:00) → UTC', () => {
    assert.equal(mxLocalToIso('2026-10-04T11:00'), '2026-10-04T17:00:00.000Z')
  })
})

describe('isoToMxLocal', () => {
  it('converts UTC ISO → Mexico City datetime-local string', () => {
    assert.equal(isoToMxLocal('2026-10-04T17:00:00.000Z'), '2026-10-04T11:00')
  })
})

describe('formatEventoFechaCorta', () => {
  it('shows Mexico City time regardless of process TZ', () => {
    const result = formatEventoFechaCorta('2026-10-04T17:00:00.000Z')
    assert.ok(result.includes('11:00'), `expected '11:00' in "${result}"`)
  })
})
