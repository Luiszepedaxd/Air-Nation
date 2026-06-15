/**
 * Detecta si url_externa apunta a una landing propia de AirNation.
 */
export function esLandingAirNation(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  try {
    const u = new URL(url.trim())
    return /(^|\.)airnation\.online$/i.test(u.hostname)
  } catch {
    return false
  }
}

/**
 * Resuelve el href correcto para una card de evento:
 * - Si url_externa apunta a airnation.online → pathname interno de la landing
 * - Si no → /eventos/{id} (ficha interna, que muestra el CTA externo)
 */
export function resolveEventHref(
  urlExterna: string | null | undefined,
  eventId: string
): string {
  if (!urlExterna?.trim()) return `/eventos/${eventId}`
  if (esLandingAirNation(urlExterna)) {
    try {
      const u = new URL(urlExterna.trim())
      return u.pathname + u.search + u.hash
    } catch {}
  }
  return `/eventos/${eventId}`
}

/**
 * True si el evento es una landing patrocinada de AirNation.
 * Útil para mostrar badge visual en cards.
 */
export function esEventoPatrocinado(urlExterna: string | null | undefined): boolean {
  return esLandingAirNation(urlExterna)
}
