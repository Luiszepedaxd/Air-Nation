import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FACTORES_TAMANO_POR_NIVEL,
  PUNTOS_BASE_POR_NIVEL,
  bolsaPorJugadores,
  factorPorJugadores,
  factoresTamano,
  tamanoInfo,
} from './ranking-tamano.ts'

describe('factores de tamaño por tipo de evento', () => {
  it('mantiene las bases de cada tipo', () => {
    assert.deepEqual(PUNTOS_BASE_POR_NIVEL, { 1: 20, 2: 80, 3: 120, 4: 200 })
  })

  it('usa los mismos porcentajes y corta distinto por tipo', () => {
    assert.deepEqual(
      FACTORES_TAMANO_POR_NIVEL[1].map((f) => [f.min, f.max, f.porcentaje]),
      [
        [6, 12, 50],
        [13, 24, 75],
        [25, 49, 100],
        [50, 79, 125],
        [80, Infinity, 150],
      ],
    )
    assert.deepEqual(
      FACTORES_TAMANO_POR_NIVEL[2].map((f) => [f.min, f.max, f.porcentaje]),
      [
        [6, 29, 50],
        [30, 59, 75],
        [60, 119, 100],
        [120, 199, 125],
        [200, Infinity, 150],
      ],
    )
    assert.deepEqual(
      FACTORES_TAMANO_POR_NIVEL[3].map((f) => [f.min, f.max, f.porcentaje]),
      [
        [6, 15, 50],
        [16, 31, 75],
        [32, 63, 100],
        [64, 127, 125],
        [128, Infinity, 150],
      ],
    )
    assert.deepEqual(
      FACTORES_TAMANO_POR_NIVEL[4].map((f) => [f.min, f.max, f.porcentaje]),
      [
        [6, 31, 75],
        [32, 63, 100],
        [64, 99, 125],
        [100, Infinity, 150],
      ],
    )
    assert.equal(
      FACTORES_TAMANO_POR_NIVEL[4].some((f) => f.porcentaje === 50),
      false,
    )
  })

  it('calcula la bolsa de los casos pedidos', () => {
    assert.equal(factorPorJugadores(3, 6), 0.5)
    assert.equal(tamanoInfo(3, 6)?.porcentaje, 50)
    assert.equal(bolsaPorJugadores(3, 6), 60)

    assert.equal(factorPorJugadores(4, 20), 0.75)
    assert.equal(tamanoInfo(4, 20)?.porcentaje, 75)
    assert.equal(bolsaPorJugadores(4, 20), 150)

    assert.equal(factorPorJugadores(1, 24), 0.75)
    assert.equal(tamanoInfo(1, 24)?.porcentaje, 75)
    assert.equal(bolsaPorJugadores(1, 24), 15)

    assert.equal(factorPorJugadores(2, 24), 0.5)
    assert.equal(tamanoInfo(2, 24)?.porcentaje, 50)
    assert.equal(bolsaPorJugadores(2, 24), 40)
  })

  it('traduce el nivel viejo 5 a final antes de buscar la tabla', () => {
    assert.equal(factorPorJugadores(5, 10), 0.75)
    assert.equal(bolsaPorJugadores(5, 20), 150)
    assert.deepEqual(
      factoresTamano(5).map((f) => f.porcentaje),
      factoresTamano(4).map((f) => f.porcentaje),
    )
  })

  it('respeta los bordes de cada tabla', () => {
    assert.equal(tamanoInfo(1, 12)?.porcentaje, 50)
    assert.equal(tamanoInfo(1, 13)?.porcentaje, 75)
    assert.equal(tamanoInfo(1, 80)?.porcentaje, 150)
    assert.equal(tamanoInfo(2, 29)?.porcentaje, 50)
    assert.equal(tamanoInfo(2, 30)?.porcentaje, 75)
    assert.equal(tamanoInfo(2, 200)?.porcentaje, 150)
    assert.equal(tamanoInfo(3, 15)?.porcentaje, 50)
    assert.equal(tamanoInfo(3, 16)?.porcentaje, 75)
    assert.equal(tamanoInfo(3, 128)?.porcentaje, 150)
    assert.equal(tamanoInfo(4, 6)?.porcentaje, 75)
    assert.equal(tamanoInfo(4, 31)?.porcentaje, 75)
    assert.equal(tamanoInfo(4, 32)?.porcentaje, 100)
    assert.equal(tamanoInfo(4, 100)?.porcentaje, 150)
  })

  it('no cuenta eventos con menos de 6 jugadores', () => {
    for (const nivel of [1, 2, 3, 4, 5]) {
      assert.equal(factorPorJugadores(nivel, 5), 0)
      assert.equal(tamanoInfo(nivel, 5), null)
      assert.equal(bolsaPorJugadores(nivel, 5), 0)
    }
  })
})
