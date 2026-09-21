const MS_HOUR = 1000 * 60 * 60
const RELATIVE_MAX_DAYS = 7

const ABSOLUTE_DATE = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** Relativo hasta 7 días; desde el día 8, fecha absoluta es-MX ("12 may 2026"). */
export function formatPostTimestamp(iso: string, nowMs: number = Date.now()): string {
  try {
    const then = new Date(iso)
    const thenMs = then.getTime()
    if (!Number.isFinite(thenMs)) return ''
    const diff = nowMs - thenMs
    const h = Math.floor(diff / MS_HOUR)
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    if (d <= RELATIVE_MAX_DAYS) {
      return d === 1 ? 'hace 1 día' : `hace ${d} días`
    }
    return ABSOLUTE_DATE.format(then)
  } catch {
    return ''
  }
}
