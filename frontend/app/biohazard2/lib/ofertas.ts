import type { VentanaInscripcion } from './types'

export type OfferLd = {
  '@type': 'Offer'
  price: string
  priceCurrency: 'MXN'
  availability: string
  validThrough?: string
}

/** Primer grupo numérico del precio, sin comas. Null si no hay dígitos. */
export function extraerPrecio(precio: string): string | null {
  const m = precio.match(/[\d.,]+/)
  if (!m) return null
  // ponytail: solo el primer grupo; "650 / 700" publica 650. Separar ofertas si hiciera falta un precio compuesto.
  const limpio = m[0].replace(/,/g, '')
  if (!/\d/.test(limpio)) return null
  return limpio
}

export function offersDesdeVentanas(ventanas: unknown): OfferLd[] {
  if (!Array.isArray(ventanas)) return []
  const offers: OfferLd[] = []
  for (const row of ventanas) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue
    const v = row as Partial<VentanaInscripcion>
    const precio = typeof v.precio === 'string' ? v.precio : ''
    const price = extraerPrecio(precio)
    if (!price) continue
    const offer: OfferLd = {
      '@type': 'Offer',
      price,
      priceCurrency: 'MXN',
      availability:
        v.estado === 'agotada'
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
    }
    const fin = typeof v.fecha_fin === 'string' ? v.fecha_fin.trim() : ''
    if (fin) offer.validThrough = fin
    offers.push(offer)
  }
  return offers
}

export function urlHttp(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return /^https?:\/\//i.test(t) ? t : undefined
}
