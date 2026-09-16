/** Ajusta una meta description a un máximo de 160 caracteres, cortando en palabra completa. */
export function ajustarDescripcion(texto: string, max = 160): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (limpio.length <= max) return limpio
  const corte = limpio.slice(0, max - 1)
  const ultimoEspacio = corte.lastIndexOf(' ')
  return `${corte.slice(0, ultimoEspacio > 100 ? ultimoEspacio : corte.length).replace(/[,.;:\s]+$/, '')}…`
}

/** Une partes no vacías con ", ". */
export function unirPartes(partes: Array<string | null | undefined>): string {
  return partes.map((p) => (p ?? '').trim()).filter(Boolean).join(', ')
}

/** Mínimo de caracteres de descripción para que la página de un equipo se indexe. */
export const MIN_CARACTERES_EQUIPO_INDEXABLE = 200
