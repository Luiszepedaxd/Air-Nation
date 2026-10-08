import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BARGE_MS, CALL_BYE_MS, CALL_LIMIT_MS, RELEASE_MS, TALK_START, VAD_HOLD_MS, bandEnergy, callClock, callEnd, disconnectInfo, easeLevel, hearingNow, micAudio, orbPhase, outputLevel, pickJoulieVoice, shouldHangUp, trackTalk, voiceFace } from './joulie-voice.ts'

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
    assert.equal(voiceFace('starting', true), 'starting')
    assert.equal(hearingNow(true, 0, 1000, false), true)
    assert.equal(hearingNow(false, 1000, 1000 + VAD_HOLD_MS - 1, false), true)
    assert.equal(hearingNow(false, 1000, 1000 + VAD_HOLD_MS, false), false)
    assert.equal(hearingNow(true, 1000, 1000, true), false, 'el micrófono silenciado no cuenta')
    assert.equal(hearingNow(false, 1000, 1000, false, true), false, 'un pico de VAD no la interrumpe')
    assert.equal(hearingNow(true, 0, 1000, false, true), true)
  })

  it('mientras ella habla solo cuenta voz sostenida, no un pico', () => {
    let talk = TALK_START
    for (let t = 0; t < 2000; t += 16) talk = trackTalk(talk, 0.2, t, true)
    assert.equal(talk.talking, false, 'el ruido del local no es voz')
    talk = trackTalk(talk, 0.55, 2016, true)
    assert.equal(talk.talking, false, 'un cuadro alto no basta')
    for (let t = 2032; t < 2016 + BARGE_MS; t += 16) talk = trackTalk(talk, 0.55, t, true)
    assert.equal(talk.talking, false)
    talk = trackTalk(talk, 0.55, 2016 + BARGE_MS, true)
    assert.equal(talk.talking, true)
    talk = trackTalk(talk, 0.2, 2016 + BARGE_MS + 16, true)
    assert.equal(talk.talking, true, 'histéresis al soltar')
    talk = trackTalk(talk, 0.2, 2016 + BARGE_MS + 16 + RELEASE_MS, true)
    assert.equal(talk.talking, false)
  })

  it('iniciando no es pensando, y pensando solo espera su audio', () => {
    assert.equal(orbPhase({ status: 'connecting', agentMode: 'listening', waiting: false, userTalking: false, sheAudible: false }), 'starting')
    assert.equal(orbPhase({ status: 'connected', agentMode: 'listening', waiting: true, userTalking: false, sheAudible: false }), 'thinking')
    assert.equal(orbPhase({ status: 'connected', agentMode: 'speaking', waiting: false, userTalking: false, sheAudible: true }), 'speaking')
    assert.equal(orbPhase({ status: 'connected', agentMode: 'listening', waiting: false, userTalking: false, sheAudible: true }), 'speaking')
    assert.equal(orbPhase({ status: 'connected', agentMode: 'speaking', waiting: false, userTalking: true, sheAudible: true }), 'hearing')
    assert.equal(orbPhase({ status: 'connected', agentMode: 'listening', waiting: false, userTalking: false, sheAudible: false }), 'listening')
  })

  it('fuerza cancelación de eco y suaviza el nivel', () => {
    const audio = micAudio({ channelCount: { ideal: 1 }, echoCancellation: false })
    assert.equal(audio.echoCancellation, true)
    assert.equal(audio.noiseSuppression, true)
    assert.equal(audio.autoGainControl, true)
    assert.equal(micAudio(true).noiseSuppression, true)
    const bins = new Uint8Array(128)
    bins.fill(255, 0, 20)
    assert.ok(bandEnergy(bins) > 0.1)
    assert.ok(easeLevel(0, 1) > 0.2 && easeLevel(0, 1) < 0.5)
    assert.equal(easeLevel(0.99, 1), 1)
  })

  it('cuelga a los 180 s y al oír el límite o la despedida', () => {
    assert.equal(CALL_LIMIT_MS, 180_000)
    assert.equal(callClock(CALL_BYE_MS - 1), 'open')
    assert.equal(callClock(CALL_BYE_MS), 'bye')
    assert.equal(callClock(CALL_LIMIT_MS), 'end')
    assert.equal(shouldHangUp('Llegaste al límite de preguntas por ahora. Intenta más tarde.'), true)
    assert.equal(shouldHangUp('Listo. Aquí te dejo.'), true)
    assert.equal(shouldHangUp('Se acabó el tiempo de prueba. Gracias por probar la beta de JOULIE.'), true)
    assert.equal(shouldHangUp('Hola, soy JOULIE. ¿En qué te ayudo?'), false)
    assert.equal(callEnd({ elapsedMs: 20_000, reason: 'error', message: 'websocket' }), 'error')
    assert.equal(callEnd({ elapsedMs: CALL_LIMIT_MS, reason: 'error', message: 'Conversation has exceeded maximum duration' }), 'time')
    assert.equal(callEnd({ elapsedMs: 1_000, reason: 'error', message: 'max_duration_exceeded' }), 'time')
    assert.equal(callEnd({ elapsedMs: 30_000, reason: 'agent', message: 'Listo. Aquí te dejo.', userEnded: false }), 'done')
    assert.equal(callEnd({ elapsedMs: 4_000, userEnded: true }), 'done')
    assert.equal(callEnd({ elapsedMs: 12_000, message: 'Llegaste al límite de preguntas por ahora. Intenta más tarde.' }), 'day')
    assert.equal(callEnd({ elapsedMs: CALL_LIMIT_MS, marked: 'day' }), 'day')
    assert.equal(disconnectInfo({ reason: 'agent', closeReason: 'max duration' }).message, 'max duration')
    assert.equal(
      disconnectInfo({ reason: 'error', message: 'limit', context: { type: 'max_duration_exceeded' } }).message,
      'limit max_duration_exceeded'
    )
  })
})
