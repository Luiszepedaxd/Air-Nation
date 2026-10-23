/** Ancla (#), ruta interna (/) o http(s). Vacío también es válido. */
export function linkOk(v: string): boolean {
  const t = v.trim()
  if (!t) return true
  if (t.startsWith('#')) return true
  if (t.startsWith('/') && !t.startsWith('//')) return true
  return /^https?:\/\//i.test(t)
}

/** Solo http(s) o vacío. */
export function httpUrlOk(v: string): boolean {
  const t = v.trim()
  return !t || /^https?:\/\//i.test(t)
}

/** Props de <a>: las rutas internas y anclas no abren pestaña nueva. */
export function propsEnlace(href: string): { target?: '_blank'; rel?: string } {
  const t = href.trim()
  if (!t || t.startsWith('#') || (t.startsWith('/') && !t.startsWith('//'))) return {}
  return { target: '_blank', rel: 'noopener noreferrer' }
}
