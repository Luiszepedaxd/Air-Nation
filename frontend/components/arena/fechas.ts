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
