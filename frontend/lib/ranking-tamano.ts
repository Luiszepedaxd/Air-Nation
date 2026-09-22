export type FactorTamanoRanking = {
  rango: string
  min: number
  max: number
  factor: number
  etiqueta: string
  porcentaje: number
}

/** Puntos del 1er lugar en tamaño normal, por tipo de evento. */
export const PUNTOS_BASE_POR_NIVEL = {
  1: 20,
  2: 80,
  3: 120,
  4: 200,
} as const

const TAMANO_CHICO = { factor: 0.5, etiqueta: 'Evento chico', porcentaje: 50 }
const TAMANO_MEDIANO = { factor: 0.75, etiqueta: 'Evento mediano', porcentaje: 75 }
const TAMANO_NORMAL = { factor: 1, etiqueta: 'Evento normal', porcentaje: 100 }
const TAMANO_GRANDE = { factor: 1.25, etiqueta: 'Evento grande', porcentaje: 125 }
const TAMANO_MASIVO = { factor: 1.5, etiqueta: 'Evento masivo', porcentaje: 150 }

function bandaTamano(
  rango: string,
  min: number,
  max: number,
  banda: { factor: number; etiqueta: string; porcentaje: number },
): FactorTamanoRanking {
  return {
    rango,
    min,
    max,
    factor: banda.factor,
    etiqueta: banda.etiqueta,
    porcentaje: banda.porcentaje,
  }
}

/**
 * Cortes de jugadores por tipo de evento. Los porcentajes no cambian.
 * La final (4) no tiene banda de 50%.
 */
export const FACTORES_TAMANO_POR_NIVEL: Record<1 | 2 | 3 | 4, readonly FactorTamanoRanking[]> = {
  1: [
    bandaTamano('6 – 12', 6, 12, TAMANO_CHICO),
    bandaTamano('13 – 24', 13, 24, TAMANO_MEDIANO),
    bandaTamano('25 – 49', 25, 49, TAMANO_NORMAL),
    bandaTamano('50 – 79', 50, 79, TAMANO_GRANDE),
    bandaTamano('80 o más', 80, Infinity, TAMANO_MASIVO),
  ],
  2: [
    bandaTamano('6 – 29', 6, 29, TAMANO_CHICO),
    bandaTamano('30 – 59', 30, 59, TAMANO_MEDIANO),
    bandaTamano('60 – 119', 60, 119, TAMANO_NORMAL),
    bandaTamano('120 – 199', 120, 199, TAMANO_GRANDE),
    bandaTamano('200 o más', 200, Infinity, TAMANO_MASIVO),
  ],
  3: [
    bandaTamano('6 – 15', 6, 15, TAMANO_CHICO),
    bandaTamano('16 – 31', 16, 31, TAMANO_MEDIANO),
    bandaTamano('32 – 63', 32, 63, TAMANO_NORMAL),
    bandaTamano('64 – 127', 64, 127, TAMANO_GRANDE),
    bandaTamano('128 o más', 128, Infinity, TAMANO_MASIVO),
  ],
  4: [
    bandaTamano('6 – 31', 6, 31, TAMANO_MEDIANO),
    bandaTamano('32 – 63', 32, 63, TAMANO_NORMAL),
    bandaTamano('64 – 99', 64, 99, TAMANO_GRANDE),
    bandaTamano('100 o más', 100, Infinity, TAMANO_MASIVO),
  ],
}

export function normalizarNivelRanking(nivel: number): number {
  if (nivel === 5) return 4
  return nivel
}

export function factoresTamano(nivel: number): readonly FactorTamanoRanking[] {
  const n = normalizarNivelRanking(nivel)
  if (n === 1 || n === 2 || n === 3 || n === 4) {
    return FACTORES_TAMANO_POR_NIVEL[n]
  }
  return FACTORES_TAMANO_POR_NIVEL[1]
}

export function factorPorJugadores(nivel: number, n: number): number {
  if (n < 6) return 0
  const match = factoresTamano(nivel).find((r) => n >= r.min && n <= r.max)
  return match?.factor ?? 0
}

export function tamanoInfo(nivel: number, n: number): FactorTamanoRanking | null {
  if (n < 6) return null
  return factoresTamano(nivel).find((r) => n >= r.min && n <= r.max) ?? null
}

function puntosBase(nivel: number): number {
  const n = normalizarNivelRanking(nivel)
  if (n === 1 || n === 2 || n === 3 || n === 4) return PUNTOS_BASE_POR_NIVEL[n]
  return PUNTOS_BASE_POR_NIVEL[1]
}

/** Puntos en juego del 1er lugar: base del tipo × porcentaje de tamaño. */
export function bolsaPorJugadores(nivel: number, jugadores: number): number {
  return Math.round(puntosBase(nivel) * factorPorJugadores(nivel, jugadores))
}
