const MX_TZ = 'America/Mexico_City'

// ponytail: fixed -06:00 offset; breaks if Mexico reinstates DST; upgrade: Intl-based offset lookup
const MX_OFFSET = '-06:00'

/** Interprets a datetime-local value ("YYYY-MM-DDTHH:mm" or with ":ss") as Mexico City time → UTC ISO. */
export function mxLocalToIso(local: string): string {
  const s = local.trim()
  const base = s.length <= 16 ? `${s.slice(0, 16)}:00` : s.slice(0, 19)
  return new Date(`${base}${MX_OFFSET}`).toISOString()
}

/** Converts a UTC ISO string → "YYYY-MM-DDTHH:mm" in Mexico City time, for prefilling datetime-local inputs. */
export function isoToMxLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const local = new Date(d.getTime() - 6 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`
}

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
      timeZone: MX_TZ,
    }).format(d)
    const timePart = new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: MX_TZ,
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
      timeZone: MX_TZ,
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
    const wdRaw = new Intl.DateTimeFormat('es-MX', { weekday: 'short', timeZone: MX_TZ }).format(d)
    const monRaw = new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: MX_TZ }).format(d)
    const strip = (s: string) => s.replace(/\.$/, '').trim()
    const cap = (s: string) => {
      const t = strip(s)
      return t.length ? t.charAt(0).toUpperCase() + t.slice(1) : t
    }
    const day = Number(new Intl.DateTimeFormat('es-MX', { day: 'numeric', timeZone: MX_TZ }).format(d))
    const timePart = new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: MX_TZ,
    }).format(d)
    return `${cap(wdRaw)} ${day} ${cap(monRaw)} · ${timePart}`
  } catch {
    return ''
  }
}

/**
 * "Dom, 4 de oct de 2026 · 11:00 a 17:00" (same CDMX day, or fin at exactly 00:00 next day)
 * "Dom, 4 de oct de 2026 · 11:00 a <fin formatted>" (different day)
 * Falls back to formatEventoFechaCorta/Larga(inicio) when fin is null/invalid.
 */
export function formatEventoRango(inicio: string, fin?: string | null, larga = false): string {
  const base = larga ? formatEventoFechaLarga(inicio) : formatEventoFechaCorta(inicio)
  if (!fin) return base
  const dFin = new Date(fin)
  if (Number.isNaN(dFin.getTime())) return base
  const dInicio = new Date(inicio)
  if (Number.isNaN(dInicio.getTime())) return base

  const mxDay = (d: Date) => isoToMxLocal(d.toISOString()).slice(0, 10)
  // fin exactly at 00:00 CDMX belongs to the previous day ("11:00 a 00:00"), hence the -1ms
  const sameDay = mxDay(dInicio) === mxDay(new Date(dFin.getTime() - 1))

  const timeFin = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: MX_TZ,
  }).format(dFin)

  if (sameDay) return `${base} a ${timeFin}`

  const baseFin = larga ? formatEventoFechaLarga(fin) : formatEventoFechaCorta(fin)
  return `${base} a ${baseFin}`
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
      timeZone: MX_TZ,
    }).format(d)
    const strip = (s: string) => s.replace(/\.$/, '').trim()
    const t = strip(datePart)
    return t.length ? t.charAt(0).toUpperCase() + t.slice(1) : t
  } catch {
    return ''
  }
}
