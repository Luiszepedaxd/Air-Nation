import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pickJoulieVoice } from './joulie-voice.ts'

describe('voz de Joulie', () => {
  it('prefiere es-MX femenina, luego es-US femenina, luego cualquier es femenina', () => {
    const paulina = { lang: 'es-MX', name: 'Paulina' }
    const jorge = { lang: 'es-MX', name: 'Jorge' }
    const monica = { lang: 'es-US', name: 'Mónica' }
    const lucia = { lang: 'es-ES', name: 'Lucía' }
    assert.equal(pickJoulieVoice([jorge, lucia, monica, paulina])?.name, 'Paulina')
    assert.equal(pickJoulieVoice([jorge, lucia, monica])?.name, 'Mónica')
    assert.equal(pickJoulieVoice([jorge, lucia])?.name, 'Lucía')
  })

  it('si no hay voz femenina usa el español disponible', () => {
    assert.equal(pickJoulieVoice([{ lang: 'es-MX', name: 'Jorge' }])?.name, 'Jorge')
    assert.equal(pickJoulieVoice([{ lang: 'en-US', name: 'Samantha' }]), null)
  })
})
