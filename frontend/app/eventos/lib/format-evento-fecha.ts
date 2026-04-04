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

/** Ej. "Sáb 12 abr · 10:00" (sin año, es-MX). */
export function formatEventoFechaDiaMesHora(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const wdRaw = new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(d)
    const monRaw = new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(d)
    const strip = (s: string) => s.replace(/\.$/, '').trim()
    const cap = (s: string) => {
      const t = strip(s)
      return t.length ? t.charAt(0).toUpperCase() + t.slice(1) : t
    }
    const day = d.getDate()
    const timePart = new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
    return `${cap(wdRaw)} ${day} ${cap(monRaw)} · ${timePart}`
  } catch {
    return ''
  }
}

/** Fecha corta para eventos pasados (título secundario). */
export function formatEventoFechaPasadaCompacta(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const datePart = new Intl.DateTimeFormat('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
    const strip = (s: string) => s.replace(/\.$/, '').trim()
    const t = strip(datePart)
    return t.length ? t.charAt(0).toUpperCase() + t.slice(1) : t
  } catch {
    return ''
  }
}
