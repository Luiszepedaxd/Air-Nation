import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { logosParaLanding, selectedIdsFromLogos, type CatalogSponsor } from './sponsors.ts'

const catalog: CatalogSponsor[] = [
  { id: 'a', nombre: 'Alpha', logo_url: 'https://cdn/a.png', link: 'https://a.example' },
  { id: 'b', nombre: 'Bravo', logo_url: 'https://cdn/b.png', link: '' },
  { id: 'c', nombre: 'Charlie', logo_url: 'https://cdn/c.png', link: 'https://c.example' },
]

describe('logosParaLanding', () => {
  it('conserva el snapshot si el catálogo no responde', () => {
    const stored = [{ nombre: 'Viejo', logo_url: 'https://cdn/viejo.png', link: '' }]
    assert.deepEqual(logosParaLanding(stored, null), stored)
    assert.deepEqual(logosParaLanding(stored, []), stored)
  })

  it('muestra solo los activos elegidos, en orden del catálogo y con el logo vigente', () => {
    const stored = [
      { id: 'c', nombre: 'Charlie viejo', logo_url: 'https://cdn/stale.png', link: '' },
      { nombre: 'Alpha', logo_url: '', link: '' },
      { nombre: 'Fuera', logo_url: 'https://cdn/no.png', link: '' },
    ]
    assert.deepEqual(logosParaLanding(stored, catalog), [
      { id: 'a', nombre: 'Alpha', logo_url: 'https://cdn/a.png', link: 'https://a.example' },
      { id: 'c', nombre: 'Charlie', logo_url: 'https://cdn/c.png', link: 'https://c.example' },
    ])
  })

  it('prioriza el id sobre un nombre repetido', () => {
    const dup: CatalogSponsor[] = [
      { id: '1', nombre: 'Misma', logo_url: 'https://cdn/1.png', link: '' },
      { id: '2', nombre: 'Misma', logo_url: 'https://cdn/2.png', link: '' },
    ]
    const ids = selectedIdsFromLogos([{ id: '2', nombre: 'Misma', logo_url: 'https://cdn/1.png', link: '' }], dup)
    assert.deepEqual([...ids], ['2'])
  })
})
