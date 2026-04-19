// Tarifas FedEx Nacional Económico 2026 — Origen fijo: Guadalajara CP 44600
// Fuente: Guía de Servicios y Tarifas FedEx México 2026

// ── PASO 1: CP destino → Grupo de código postal ──────────────────────────────

const CP_GRUPOS: [number, number, string][] = [
  // Aguascalientes
  [20000, 20997, 'L'],
  // Baja California
  [21000, 22997, 'D'],
  // Baja California Sur
  [23000, 23099, 'H'],
  [23100, 23997, 'D'],
  // Campeche
  [24000, 24936, 'P'],
  // Chiapas
  [29000, 30997, 'O'],
  // Chihuahua
  [31000, 33997, 'F'],
  // Ciudad de México
  [1000, 19999, 'A'],
  // Coahuila
  [25000, 25998, 'B'],
  [26000, 26099, 'M'],
  [26110, 26980, 'M'],
  [27000, 27399, 'G'],
  [27400, 27997, 'B'],
  // Colima
  [28000, 28989, 'I'],
  // Durango
  [34000, 35998, 'G'],
  // Estado de México
  [50000, 52497, 'K'],
  [52500, 52506, 'A'],
  [52540, 52757, 'K'],
  [52760, 54198, 'A'],
  [54200, 54399, 'K'],
  [54400, 54477, 'A'],
  [54480, 54575, 'K'],
  [54600, 54658, 'A'],
  [54660, 54697, 'K'],
  [54700, 55549, 'A'],
  [55600, 55697, 'K'],
  [55700, 55773, 'K'],
  [55776, 55799, 'K'],
  [55800, 55859, 'K'],
  [55870, 56096, 'K'],
  [56100, 56269, 'A'],
  [56270, 56320, 'K'],
  [56325, 56366, 'K'],
  [56370, 56394, 'A'],
  [56395, 56647, 'A'],
  [56650, 56999, 'K'],
  [57000, 57950, 'A'],
  // Guanajuato
  [36000, 38998, 'L'],
  // Guerrero
  [39000, 41997, 'J'],
  // Hidalgo
  [42000, 43998, 'K'],
  // Jalisco
  [44008, 45245, 'C'],
  [45250, 45399, 'I'],
  [45400, 45429, 'C'],
  [45430, 45496, 'I'],
  [45500, 45690, 'C'],
  [45691, 49994, 'I'],
  // Michoacán
  [58000, 60948, 'L'],
  [60950, 60959, 'J'],
  [60960, 61998, 'L'],
  // Morelos
  [62000, 62996, 'K'],
  // Nayarit
  [63000, 63996, 'I'],
  // Nuevo León
  [64000, 67996, 'B'],
  // Oaxaca
  [68000, 71998, 'O'],
  // Puebla
  [72000, 75997, 'K'],
  // Querétaro
  [76000, 76998, 'L'],
  // Quintana Roo
  [77000, 77997, 'P'],
  // San Luis Potosí
  [78000, 79997, 'L'],
  // Sinaloa
  [80000, 82996, 'H'],
  // Sonora
  [83000, 85994, 'E'],
  // Tabasco
  [86000, 86998, 'N'],
  // Tamaulipas
  [87000, 87189, 'N'],
  [87200, 88995, 'M'],
  [89000, 89369, 'N'],
  [89400, 89970, 'M'],
  // Tlaxcala
  [90000, 90990, 'K'],
  // Veracruz
  [91000, 96998, 'N'],
  // Yucatán
  [97000, 97993, 'P'],
  // Zacatecas
  [98000, 99998, 'L'],
]

export function cpAGrupo(cp: string): string | null {
  const n = parseInt(cp.trim(), 10)
  if (isNaN(n)) return null
  for (const [min, max, grupo] of CP_GRUPOS) {
    if (n >= min && n <= max) return grupo
  }
  return null
}

// ── PASO 2: Grupo origen × Grupo destino → Zona ──────────────────────────────
// Filas = origen (A-P), Columnas = destino (A-P)
// Zona 1 marcada como 1, zonas 2-8 como número, zona local (misma ciudad) = 1

const GRUPOS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'] as const
type Grupo = typeof GRUPOS[number]

const MATRIZ_ZONAS: Record<Grupo, Record<Grupo, number>> = {
  A: { A:1, B:4, C:4, D:7, E:8, F:6, G:5, H:3, I:4, J:2, K:3, L:5, M:4, N:5, O:6, P:6 },
  B: { A:4, B:1, C:5, D:6, E:7, F:4, G:3, H:6, I:5, J:6, K:4, L:4, M:3, N:4, O:6, P:7 },
  C: { A:4, B:5, C:1, D:7, E:6, F:6, G:4, H:4, I:2, J:4, K:5, L:4, M:6, N:6, O:6, P:7 },
  D: { A:7, B:6, C:7, D:1, E:4, F:6, G:6, H:4, I:7, J:8, K:8, L:8, M:7, N:7, O:8, P:8 },
  E: { A:8, B:7, C:6, D:4, E:1, F:4, G:5, H:4, I:6, J:8, K:8, L:8, M:7, N:7, O:8, P:8 },
  F: { A:6, B:4, C:6, D:6, E:4, F:1, G:4, H:4, I:6, J:7, K:6, L:6, M:5, N:7, O:7, P:8 },
  G: { A:5, B:3, C:4, D:6, E:5, F:4, G:1, H:3, I:4, J:6, K:5, L:4, M:4, N:6, O:7, P:8 },
  H: { A:7, B:6, C:4, D:4, E:4, F:4, G:3, H:1, I:4, J:7, K:6, L:5, M:7, N:7, O:7, P:8 },
  I: { A:4, B:5, C:2, D:7, E:6, F:6, G:4, H:4, I:1, J:4, K:5, L:4, M:6, N:6, O:6, P:7 },
  J: { A:3, B:6, C:4, D:8, E:8, F:7, G:6, H:7, I:4, J:1, K:3, L:5, M:6, N:5, O:5, P:6 },
  K: { A:3, B:4, C:5, D:8, E:8, F:6, G:5, H:6, I:5, J:3, K:1, L:3, M:2, N:4, O:4, P:6 },
  L: { A:3, B:4, C:4, D:8, E:8, F:6, G:4, H:5, I:4, J:5, K:3, L:1, M:4, N:4, O:4, P:7 },
  M: { A:5, B:3, C:6, D:7, E:7, F:5, G:4, H:7, I:6, J:6, K:5, L:4, M:1, N:5, O:7, P:8 },
  N: { A:4, B:4, C:6, D:7, E:7, F:7, G:7, H:7, I:6, J:5, K:4, L:4, M:5, N:1, O:3, P:3 },
  O: { A:5, B:6, C:6, D:8, E:8, F:7, G:7, H:7, I:6, J:5, K:4, L:6, M:7, N:3, O:1, P:3 },
  P: { A:6, B:7, C:7, D:8, E:8, F:8, G:8, H:8, I:7, J:6, K:6, L:7, M:8, N:3, O:3, P:1 },
}

export function gruposAZona(origen: string, destino: string): number | null {
  const o = origen as Grupo
  const d = destino as Grupo
  if (!GRUPOS.includes(o) || !GRUPOS.includes(d)) return null
  return MATRIZ_ZONAS[o][d]
}

// ── PASO 3: Zona + Peso → Tarifa ─────────────────────────────────────────────
// Tarifas FedEx Nacional Económico 2026 en MXN
// zonas[zona-1][index] donde index 0 = sobre, 1 = 1kg, 2 = 2kg ... 30 = 30kg

const TARIFAS_POR_ZONA: number[][] = [
  // Zona 1
  [242.43,242.43,252.09,261.75,271.42,281.08,290.56,300.03,309.51,318.99,328.47,339.52,350.58,361.63,372.68,383.74,394.89,406.03,417.18,428.33,439.48,452.49,465.51,478.52,491.54,504.55,517.45,530.35,543.25,556.15,569.05],
  // Zona 2
  [248.43,248.43,258.37,268.31,278.25,288.19,298.85,309.51,320.17,330.83,341.49,353.94,366.39,378.83,391.28,403.73,415.70,427.67,439.64,451.61,463.58,476.30,489.01,501.72,514.44,527.15,539.62,552.09,564.56,577.03,589.50],
  // Zona 3
  [264.49,264.49,275.35,286.21,297.06,307.92,319.22,330.52,341.82,353.12,364.41,376.93,389.45,401.96,414.48,427.00,439.37,451.75,464.13,476.50,488.88,503.86,518.83,533.81,548.78,563.76,578.06,592.37,606.67,620.97,635.27],
  // Zona 4
  [285.63,285.63,299.63,313.63,327.63,341.63,355.97,370.31,384.64,398.98,413.32,428.43,443.55,458.66,473.78,488.89,504.45,520.00,535.56,551.12,566.67,585.73,604.79,623.85,642.91,661.97,680.66,699.36,718.06,736.76,755.46],
  // Zona 5
  [298.67,298.67,313.91,329.15,344.39,359.63,376.06,392.49,408.91,425.34,441.76,458.36,474.96,491.56,508.16,524.76,541.50,558.24,574.98,591.72,608.45,627.70,646.94,666.19,685.43,704.68,723.54,742.40,761.26,780.12,798.98],
  // Zona 6
  [334.72,334.72,354.01,373.30,392.59,411.88,431.00,450.11,469.23,488.35,507.47,527.96,548.46,568.96,589.45,609.95,630.47,650.99,671.51,692.03,712.55,735.41,758.26,781.11,803.96,826.81,849.46,872.10,894.74,917.39,940.03],
  // Zona 7
  [353.32,353.32,372.49,391.65,410.81,429.98,448.95,467.93,486.91,505.89,524.87,545.40,565.93,586.46,606.99,627.53,648.17,668.82,689.47,710.12,730.77,755.26,779.76,804.26,828.76,853.26,877.53,901.80,926.06,950.33,974.60],
  // Zona 8
  [392.40,392.40,413.24,434.07,454.91,475.74,496.49,517.24,537.99,558.75,579.50,601.73,623.95,646.18,668.40,690.63,713.89,737.15,760.40,783.66,806.92,833.40,859.88,886.37,912.85,939.33,965.82,992.30,1018.78,1045.26,1071.75],
]

const KG_ADICIONAL_POR_ZONA = [13.02, 13.26, 15.30, 19.93, 21.44, 23.73, 26.04, 28.57]

export function calcularTarifa(zona: number, pesoKg: number): number {
  if (zona < 1 || zona > 8) return 0
  const tarifas = TARIFAS_POR_ZONA[zona - 1]
  const pesoRedondeado = Math.ceil(pesoKg)
  if (pesoRedondeado <= 0) return tarifas[0] // sobre
  if (pesoRedondeado <= 30) return tarifas[pesoRedondeado]
  // Más de 30kg: tarifa de 30kg + kg adicional
  const extra = pesoRedondeado - 30
  return tarifas[30] + extra * KG_ADICIONAL_POR_ZONA[zona - 1]
}

// ── FUNCIÓN PRINCIPAL ─────────────────────────────────────────────────────────

const CP_ORIGEN = '44600' // Guadalajara — fijo
const GRUPO_ORIGEN = 'C'  // Jalisco 44008-45245

export type CotizacionEnvio = {
  ok: true
  zona: number
  peso_cobrable: number
  costo: number
  grupo_destino: string
} | {
  ok: false
  error: string
}

export function cotizarEnvio(cpDestino: string, pesoRealKg: number, largo_cm: number, ancho_cm: number, alto_cm: number): CotizacionEnvio {
  // Validar CP
  if (!cpDestino || cpDestino.length !== 5) {
    return { ok: false, error: 'CP inválido' }
  }

  // Peso volumétrico FedEx: (largo × ancho × alto) / 5000
  const pesoVolumetrico = (largo_cm * ancho_cm * alto_cm) / 5000

  // Factor de embalaje: +15% sobre peso real (caja + relleno)
  const pesoConEmbalaje = pesoRealKg * 1.15

  // Peso cobrable = el mayor entre real con embalaje y volumétrico
  const pesoCobrable = Math.max(pesoConEmbalaje, pesoVolumetrico)

  // Grupo destino
  const grupoDestino = cpAGrupo(cpDestino)
  if (!grupoDestino) {
    return { ok: false, error: 'CP no encontrado en la red FedEx' }
  }

  // Zona
  const zona = gruposAZona(GRUPO_ORIGEN, grupoDestino)
  if (!zona) {
    return { ok: false, error: 'No se pudo determinar la zona de envío' }
  }

  // Tarifa
  const costo = calcularTarifa(zona, pesoCobrable)

  return {
    ok: true,
    zona,
    peso_cobrable: Math.ceil(pesoCobrable * 100) / 100,
    costo: Math.round(costo),
    grupo_destino: grupoDestino,
  }
}
