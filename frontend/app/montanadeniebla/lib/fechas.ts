export type EstadoVentana = 'pasada' | 'activa' | 'futura'

const TZ_OFFSET = '-06:00'

function inicioVentanaMs(fechaDesde: string): number {
  const d = fechaDesde.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return NaN
  return new Date(`${d}T00:00:00${TZ_OFFSET}`).getTime()
}

function finVentanaMs(fechaHasta: string): number {
  const d = fechaHasta.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return NaN
  return new Date(`${d}T23:59:59${TZ_OFFSET}`).getTime()
}

export function estadoVentana(
  ventana: { fecha_desde: string; fecha_hasta: string },
  ahora: Date = new Date()
): EstadoVentana {
  const now = ahora.getTime()
  const start = inicioVentanaMs(ventana.fecha_desde)
  const end = finVentanaMs(ventana.fecha_hasta)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'futura'
  if (now < start) return 'futura'
  if (now > end) return 'pasada'
  return 'activa'
}

const mesCorto = new Intl.DateTimeFormat('es-MX', {
  month: 'short',
  timeZone: 'America/Mexico_City',
})

function diaMesCorto(isoDate: string): string {
  const d = isoDate.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const dt = new Date(`${d}T12:00:00${TZ_OFFSET}`)
  if (!Number.isFinite(dt.getTime())) return d
  const day = dt.getUTCDate()
  const mes = mesCorto.format(dt).replace('.', '').toLowerCase()
  return `${day} ${mes}`
}

export function formatoRangoCorto(fechaDesde: string, fechaHasta: string): string {
  const a = diaMesCorto(fechaDesde)
  const b = diaMesCorto(fechaHasta)
  if (!a && !b) return 'Fechas por definir'
  if (a === b) return a
  return `${a} - ${b}`
}
