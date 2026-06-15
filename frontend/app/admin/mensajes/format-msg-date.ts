const MONTHS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const

function padTime(n: number): string {
  return String(n).padStart(2, '0')
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** "Hoy · 14:32" / "Ayer · 09:15" / "21 jun · 14:32" */
export function formatMsgDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'

  const now = new Date()
  const time = `${padTime(d.getHours())}:${padTime(d.getMinutes())}`

  if (isSameDay(d, now)) return `Hoy · ${time}`

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(d, yesterday)) return `Ayer · ${time}`

  const day = d.getDate()
  const month = MONTHS_ES[d.getMonth()] ?? '???'
  return `${day} ${month} · ${time}`
}

/** Relativo corto para listas: "hace 5 min", "hace 2h", "hace 3 días" */
export function formatTimeAgo(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'

  const diffMs = Date.now() - d.getTime()
  if (diffMs < 0) return 'ahora'

  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'hace 1 día'
  if (days < 30) return `hace ${days} días`

  const months = Math.floor(days / 30)
  if (months === 1) return 'hace 1 mes'
  return `hace ${months} meses`
}
