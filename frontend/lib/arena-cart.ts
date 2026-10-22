/**
 * Carrito de ARENA: un campo y un día por compra, así el checkout sigue
 * siendo UNA reserva (`POST /arena/bookings`) y no hace falta nada nuevo en la
 * BD. Vive en localStorage y solo guarda ids y cantidades: los precios y los
 * totales de verdad los calcula el backend al crear la reserva.
 */
import type { ArenaItem } from '@/lib/arena-api'

const KEY = 'arena_cart_v1'

export type ArenaCart = {
  field_id: string
  slug: string
  nombre: string
  /** YYYY-MM-DD; vacío mientras el jugador no elige día. */
  fecha: string
  num_jugadores: number
  /** Paquete o derecho de campo elegido; la BD exige exactamente uno. */
  base_id: string
  /** item_id → cantidad pedida, para rentas y extras. */
  extras: Record<string, number>
}

export function cartVacio(
  campo: Pick<ArenaCart, 'field_id' | 'slug' | 'nombre'>,
  jugadores = 4
): ArenaCart {
  return { ...campo, fecha: '', num_jugadores: jugadores, base_id: '', extras: {} }
}

/** Cantidad con la que se cobra un concepto, con las mismas reglas que la BD. */
export function cantidadDe(item: ArenaItem, elegida: number, jugadores: number): number {
  if (item.unidad === 'por_reserva') return 1
  if (item.unidad === 'por_persona') return item.es_base ? jugadores : Math.min(elegida, jugadores)
  return Math.max(elegida, 1)
}

export type ArenaCartRenglon = {
  item: ArenaItem
  cantidad: number
  subtotal_centavos: number
}

/** Renglones del carrito: primero el paquete, luego los extras. */
export function renglonesCart(cart: ArenaCart, items: ArenaItem[]): ArenaCartRenglon[] {
  const ids = [cart.base_id, ...Object.keys(cart.extras)].filter(Boolean)
  return ids.flatMap((id) => {
    const item = items.find((i) => i.id === id)
    if (!item) return []
    const cantidad = cantidadDe(item, cart.extras[id] ?? 1, cart.num_jugadores)
    return [{ item, cantidad, subtotal_centavos: item.precio_centavos * cantidad }]
  })
}

/** Total estimado en centavos (el cobro real lo recalcula el backend). */
export function totalCart(cart: ArenaCart, items: ArenaItem[]): number {
  return renglonesCart(cart, items).reduce((s, r) => s + r.subtotal_centavos, 0)
}

/** Agrega (o reemplaza) un concepto en el carrito. */
export function agregarItem(cart: ArenaCart, item: ArenaItem, cantidad = 1): ArenaCart {
  if (item.es_base) return { ...cart, base_id: item.id }
  return { ...cart, extras: { ...cart.extras, [item.id]: Math.max(1, cantidad) } }
}

export function quitarItem(cart: ArenaCart, itemId: string): ArenaCart {
  if (cart.base_id === itemId) return { ...cart, base_id: '' }
  const extras = { ...cart.extras }
  delete extras[itemId]
  return { ...cart, extras }
}

/** Payload de `items` para POST /arena/bookings. */
export function itemsParaReserva(
  cart: ArenaCart,
  items: ArenaItem[]
): { item_id: string; cantidad?: number }[] {
  return renglonesCart(cart, items).map(({ item, cantidad }) =>
    item.es_base || item.unidad === 'por_reserva'
      ? { item_id: item.id }
      : { item_id: item.id, cantidad }
  )
}

// ─── Persistencia ────────────────────────────────────────────────────────────

export function loadCart(): ArenaCart | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as ArenaCart
    if (!c?.field_id || !c?.slug) return null
    return {
      ...c,
      num_jugadores: Number(c.num_jugadores) || 1,
      base_id: String(c.base_id || ''),
      extras: c.extras && typeof c.extras === 'object' ? c.extras : {},
    }
  } catch {
    return null
  }
}

export function saveCart(cart: ArenaCart): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cart))
  } catch {
    /* modo privado o storage lleno: el carrito solo deja de persistir */
  }
}

export function clearCart(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ídem */
  }
}
