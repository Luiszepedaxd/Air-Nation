/** Claves JSON para `fields.horarios_json` */
export const FIELD_DAY_KEYS = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
] as const

export type FieldDayKey = (typeof FIELD_DAY_KEYS)[number]

export const FIELD_DAY_LABELS: Record<FieldDayKey, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export type DayScheduleEntry = {
  abierto: boolean
  apertura: string
  cierre: string
}

export type WeekScheduleState = Record<FieldDayKey, DayScheduleEntry>

export function defaultWeekSchedule(): WeekScheduleState {
  const o = {} as WeekScheduleState
  for (const k of FIELD_DAY_KEYS) {
    o[k] = { abierto: false, apertura: '09:00', cierre: '18:00' }
  }
  return o
}

export function weekScheduleFromJson(raw: unknown): WeekScheduleState {
  const base = defaultWeekSchedule()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base
  const obj = raw as Record<string, unknown>
  for (const k of FIELD_DAY_KEYS) {
    const e = obj[k]
    if (!e || typeof e !== 'object' || Array.isArray(e)) continue
    const ex = e as Record<string, unknown>
    base[k] = {
      abierto: Boolean(ex.abierto),
      apertura:
        typeof ex.apertura === 'string' && ex.apertura.trim()
          ? ex.apertura.trim()
          : '09:00',
      cierre:
        typeof ex.cierre === 'string' && ex.cierre.trim()
          ? ex.cierre.trim()
          : '18:00',
    }
  }
  return base
}

export function weekScheduleToJson(
  state: WeekScheduleState
): Record<string, { abierto: boolean; apertura?: string; cierre?: string }> {
  const out: Record<
    string,
    { abierto: boolean; apertura?: string; cierre?: string }
  > = {}
  for (const k of FIELD_DAY_KEYS) {
    const e = state[k]
    if (!e.abierto) {
      out[k] = { abierto: false }
    } else {
      out[k] = {
        abierto: true,
        apertura: e.apertura || '09:00',
        cierre: e.cierre || '18:00',
      }
    }
  }
  return out
}
