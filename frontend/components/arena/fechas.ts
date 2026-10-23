/**
 * Las fechas de ARENA son días de calendario (`YYYY-MM-DD`), sin hora: se
 * formatean en UTC para que no se corran un día en el navegador del jugador.
 */
export function fechaCorta(fecha: string): string {
  return fmt(fecha, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fechaLarga(fecha: string): string {
  return fmt(fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmt(fecha: string, opciones: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = String(fecha).split('-').map(Number)
  if (!y || !m || !d) return String(fecha)
  return new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', ...opciones }).format(
    new Date(Date.UTC(y, m - 1, d))
  )
}

/** Un instante sí lleva hora: se muestra en hora del centro de México. */
export function horaMexico(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))
}

/** Hoy en Ciudad de México, como `YYYY-MM-DD`. */
export function hoyMexico(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

/** Suma días a un `YYYY-MM-DD` sin tocar zonas horarias. */
export function sumaDias(fecha: string, dias: number): string {
  const [y, m, d] = String(fecha).split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + dias))
  return t.toISOString().slice(0, 10)
}

/** Piezas de una fecha para la tira de días: "sáb", "24", "oct". */
export function dowCorto(fecha: string): string {
  return fmt(fecha, { weekday: 'short' }).replace('.', '')
}

export function mesCorto(fecha: string): string {
  return fmt(fecha, { month: 'short' }).replace('.', '')
}

export function diaNumero(fecha: string): string {
  return fmt(fecha, { day: 'numeric' })
}

/** "sábado 24 de octubre" (sin año: la reserva siempre es cercana). */
export function fechaMedia(fecha: string): string {
  return fmt(fecha, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Mayúscula inicial, para textos que empiezan con la fecha. */
export function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "09:00:00" → "9 am"; "17:30" → "5:30 pm". */
export function horaCorta(hora: string | null | undefined): string {
  if (!hora) return ''
  const [hh, mm] = String(hora).split(':').map(Number)
  if (!Number.isFinite(hh)) return String(hora)
  const ap = hh >= 12 ? 'pm' : 'am'
  const h12 = ((hh + 11) % 12) + 1
  return mm ? `${h12}:${String(mm).padStart(2, '0')} ${ap}` : `${h12} ${ap}`
}

/** 180 → "3 h"; 90 → "1.5 h"; 45 → "45 min". */
export function duracionCorta(minutos: number | null | undefined): string {
  if (!minutos) return ''
  if (minutos < 60) return `${minutos} min`
  const horas = minutos / 60
  return `${Number.isInteger(horas) ? horas : horas.toFixed(1).replace('.0', '')} h`
}
