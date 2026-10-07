import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { TALK_START, VAD_HOLD_MS, hearingNow, outputLevel, pickJoulieVoice, trackTalk, voiceFace } from './joulie-voice.ts'

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

  it('detecta la voz del operador sobre el ruido de fondo', () => {
    let talk = TALK_START
    for (let t = 0; t < 2000; t += 16) talk = trackTalk(talk, 0.12, t)
    assert.equal(talk.talking, false, 'ruido constante no es voz')
    talk = trackTalk(talk, 0.3, 2016)
    assert.equal(talk.talking, true)
    talk = trackTalk(talk, 0.12, 2200)
    assert.equal(talk.talking, true, 'gracia entre sílabas')
    talk = trackTalk(talk, 0.12, 2400)
    assert.equal(talk.talking, false)
  })

  it('un alza modesta del micrófono de teléfono cuenta como voz', () => {
    let talk = TALK_START
    for (let t = 0; t < 2000; t += 16) talk = trackTalk(talk, 0.1, t)
    assert.equal(talk.talking, false)
    talk = trackTalk(talk, 0.16, 2016)
    assert.equal(talk.talking, true)
  })

  it('sube el volumen de salida para que el orbe se note', () => {
    assert.equal(outputLevel(0), 0)
    assert.equal(outputLevel(Number.NaN), 0)
    assert.equal(outputLevel(0.02), 0, 'el ruido de salida no mueve el orbe')
    const mid = outputLevel(0.15)
    assert.ok(mid > 0.5 && mid < 0.75, `0.15 debe verse, fue ${mid}`)
    assert.equal(outputLevel(1), 1)
    assert.equal(outputLevel(0, new Uint8Array(128)), 0)
    const voice = new Uint8Array(128)
    voice.fill(180, 0, 40)
    assert.ok(outputLevel(0, voice) > 0.85, 'la banda de voz mueve el orbe aunque el volumen venga en cero')
  })

  it('pasa a escuchando en cuanto el operador habla, también si ella sigue en speaking', () => {
    assert.equal(voiceFace('speaking', true), 'hearing')
    assert.equal(voiceFace('listening', true), 'hearing')
    assert.equal(voiceFace('speaking', false), 'speaking')
    assert.equal(voiceFace('thinking', true), 'thinking')
    assert.equal(hearingNow(true, 0, 1000, false), true)
    assert.equal(hearingNow(false, 1000, 1000 + VAD_HOLD_MS - 1, false), true)
    assert.equal(hearingNow(false, 1000, 1000 + VAD_HOLD_MS, false), false)
    assert.equal(hearingNow(true, 1000, 1000, true), false, 'el micrófono silenciado no cuenta')
  })
})
