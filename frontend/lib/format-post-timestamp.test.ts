import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatPostTimestamp } from './format-post-timestamp.ts'

const NOW = Date.parse('2026-09-21T15:00:00.000Z')
const HOUR = 1000 * 60 * 60
const DAY = 24 * HOUR

function isoAgo(ms: number): string {
  return new Date(NOW - ms).toISOString()
}

describe('formatPostTimestamp', () => {
  it('uses relative labels for age up to 7 days', () => {
    assert.equal(formatPostTimestamp(isoAgo(30 * 60 * 1000), NOW), 'hace unos minutos')
    assert.equal(formatPostTimestamp(isoAgo(1 * HOUR), NOW), 'hace 1h')
    assert.equal(formatPostTimestamp(isoAgo(5 * HOUR), NOW), 'hace 5h')
    assert.equal(formatPostTimestamp(isoAgo(1 * DAY), NOW), 'hace 1 día')
    assert.equal(formatPostTimestamp(isoAgo(2 * DAY), NOW), 'hace 2 días')
    assert.equal(formatPostTimestamp(isoAgo(7 * DAY), NOW), 'hace 7 días')
  })

  it('uses an absolute es-MX date from day 8 onward', () => {
    const eightDays = formatPostTimestamp(isoAgo(8 * DAY), NOW)
    const old = formatPostTimestamp(isoAgo(145 * DAY), NOW)
    assert.match(eightDays, /^\d{1,2} [a-záéíóúñ]{3} \d{4}$/)
    assert.match(old, /^\d{1,2} [a-záéíóúñ]{3} \d{4}$/)
    assert.doesNotMatch(eightDays, /hace/)
    assert.doesNotMatch(old, /hace/)

    const may12 = formatPostTimestamp('2026-05-12T12:00:00.000Z', NOW)
    assert.equal(may12, '12 may 2026')
  })

  it('returns empty string for invalid dates', () => {
    assert.equal(formatPostTimestamp('not-a-date', NOW), '')
  })
})
