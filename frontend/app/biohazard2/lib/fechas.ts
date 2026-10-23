/** Quintana Roo usa UTC-05:00 todo el año (sin horario de verano). */
export const BH2_TZ_OFFSET = '-05:00'
export const BH2_TIMEZONE = 'America/Cancun'

/** datetime-local del admin → ISO con offset de Cancún. Vacío si no hay fecha. */
export function datetimeLocalToIsoCancun(dt: string): string {
  if (!dt?.trim()) return ''
  const [dp, tp = '00:00'] = dt.split('T')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dp)) return ''
  const [hh = '00', mm = '00'] = tp.split(':')
  return `${dp}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:00${BH2_TZ_OFFSET}`
}

const fechaCorta = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: BH2_TIMEZONE,
})

/** YYYY-MM-DD (o ISO) en hora Cancún. Cadena vacía si no hay día válido. */
export function formatoFechaCancun(iso: string): string {
  const d = iso.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return ''
  const dt = new Date(`${d}T12:00:00${BH2_TZ_OFFSET}`)
  if (!Number.isFinite(dt.getTime())) return ''
  return fechaCorta.format(dt).replace(/\./g, '')
}
