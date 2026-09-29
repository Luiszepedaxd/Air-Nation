import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mxLocalToIso, isoToMxLocal, formatEventoFechaCorta, formatEventoRango } from '../app/eventos/lib/format-evento-fecha.ts'

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

describe('formatEventoRango', () => {
  it('same-day: contains "11:00 a 17:00"', () => {
    const r = formatEventoRango('2026-10-04T17:00:00.000Z', '2026-10-04T23:00:00.000Z')
    assert.ok(r.includes('11:00 a 17:00'), `expected '11:00 a 17:00' in "${r}"`)
  })

  it('cross-day: contains both days', () => {
    // inicio Sun Oct 4 11:00 CDMX, fin Mon Oct 5 17:00 CDMX
    const r = formatEventoRango('2026-10-04T17:00:00.000Z', '2026-10-05T23:00:00.000Z')
    assert.ok(r.includes('4'), `expected inicio day in "${r}"`)
    assert.ok(r.includes('5'), `expected fin day in "${r}"`)
    assert.ok(r.includes(' a '), `expected ' a ' in "${r}"`)
  })

  it('null fin equals formatEventoFechaCorta', () => {
    const iso = '2026-10-04T17:00:00.000Z'
    assert.equal(formatEventoRango(iso, null), formatEventoFechaCorta(iso))
  })

  it('midnight-next-day is same-day style with 00:00', () => {
    // inicio CDMX 11:00 Oct 4, fin CDMX 00:00 Oct 5 (= 06:00 UTC Oct 5)
    const r = formatEventoRango('2026-10-04T17:00:00.000Z', '2026-10-05T06:00:00.000Z')
    assert.ok(r.includes('11:00 a 00:00'), `expected '11:00 a 00:00' in "${r}"`)
  })
})
