/** Fecha tipo "Sáb 12 abr 2026 · 10:00" (es-MX). */
export function formatEventoFechaCorta(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const datePart = new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
    const timePart = new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
    const cap =
      datePart.length > 0
        ? datePart.charAt(0).toUpperCase() + datePart.slice(1)
        : datePart
    return `${cap} · ${timePart}`
  } catch {
    return ''
  }
}

export function formatEventoFechaLarga(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return ''
  }
}

export function disciplinaLabel(raw: string | null | undefined): string {
  const s = (raw ?? '').toLowerCase().trim()
  if (s === 'airsoft') return 'AIRSOFT'
  return (raw ?? '').toUpperCase() || 'AIRSOFT'
}
