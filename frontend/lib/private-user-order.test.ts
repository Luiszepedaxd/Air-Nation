import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { compareRegistroDesc } from './supabase/private-user.ts'

describe('compareRegistroDesc', () => {
  it('orders newest registration first and sinks missing dates', () => {
    const rows = [
      { id: 'old', created_at: '2026-04-14T12:00:00.000Z' },
      { id: 'none', created_at: null },
      { id: 'new', created_at: '2026-10-22T12:00:00.000Z' },
      { id: 'bad', created_at: 'no-es-fecha' },
      { id: 'mid', created_at: '2026-05-02T12:00:00.000Z' },
    ]
    rows.sort(compareRegistroDesc)
    assert.deepEqual(
      rows.map((row) => row.id),
      ['new', 'mid', 'old', 'none', 'bad']
    )
  })
})
