/**
 * Carrito de ARENA: hasta 10 reservas, una por campo y día. Vive solo en el
 * cliente (`localStorage`) hasta pagar; al pagar, `POST /arena/checkout` crea
 * todas las reservas en una transacción y un solo pago.
 *
 * Guarda ids y cantidades, más una copia de nombres y precios **solo para
 * mostrar**: el total que se cobra lo calcula `arena_create_checkout`.
 */
import type { ArenaItem } from '@/lib/arena-api'

const KEY = 'arena_cart_v1'

export const MAX_CARRITO = 10

/** Lo que el jugador eligió en el panel de reserva de un campo. */
export type ArenaSeleccion = {
  fecha: string
  num_jugadores: number
  /** Paquete o derecho de campo; la BD exige exactamente uno. */
  base_id: string
  /** item_id → cantidad, para rentas y extras. */
  extras: Record<string, number>
}

export type ArenaCartLinea = {
  item_id: string
  nombre: string
  cantidad: number
  subtotal_centavos: number
}

export type ArenaCartItem = ArenaSeleccion & {
  field_id: string
  slug: string
  nombre: string
  ciudad: string | null
  foto_portada_url: string | null
  lineas: ArenaCartLinea[]
  total_centavos: number
}

/** Cantidad con la que se cobra un concepto, con las mismas reglas que la BD. */
export function cantidadDe(item: ArenaItem, elegida: number, jugadores: number): number {
  if (item.unidad === 'por_reserva') return 1
  if (item.unidad === 'por_persona') return item.es_base ? jugadores : Math.min(elegida, jugadores)
  return Math.max(elegida, 1)
}

/** Renglones de una selección: primero el paquete, luego rentas y extras. */
export function renglones(
  seleccion: ArenaSeleccion,
  items: ArenaItem[]
): { item: ArenaItem; cantidad: number; subtotal_centavos: number }[] {
  const ids = [seleccion.base_id, ...Object.keys(seleccion.extras)].filter(Boolean)
  return ids.flatMap((id) => {
    const item = items.find((i) => i.id === id)
    if (!item) return []
    const cantidad = cantidadDe(item, seleccion.extras[id] ?? 1, seleccion.num_jugadores)
    if (cantidad < 1) return []
    return [{ item, cantidad, subtotal_centavos: item.precio_centavos * cantidad }]
  })
}

/** Total estimado de una selección (el cobro real lo recalcula el backend). */
export function totalSeleccion(seleccion: ArenaSeleccion, items: ArenaItem[]): number {
  return renglones(seleccion, items).reduce((s, r) => s + r.subtotal_centavos, 0)
}

export function totalCarrito(cart: ArenaCartItem[]): number {
  return cart.reduce((s, c) => s + c.total_centavos, 0)
}

/** Selección + catálogo + campo → renglón del carrito. */
export function aItemDeCarrito(
  campo: Pick<ArenaCartItem, 'field_id' | 'slug' | 'nombre' | 'ciudad' | 'foto_portada_url'>,
  seleccion: ArenaSeleccion,
  items: ArenaItem[]
): ArenaCartItem {
  const lineas = renglones(seleccion, items).map(({ item, cantidad, subtotal_centavos }) => ({
    item_id: item.id,
    nombre: item.nombre,
    cantidad,
    subtotal_centavos,
  }))
  return {
    ...campo,
    ...seleccion,
    extras: { ...seleccion.extras },
    lineas,
    total_centavos: lineas.reduce((s, l) => s + l.subtotal_centavos, 0),
  }
}

/**
 * Mete una reserva al carrito. El mismo campo y día se reemplaza (con aviso) y
 * la reserva 11 se rechaza.
 */
export function upsertCarrito(
  cart: ArenaCartItem[],
  item: ArenaCartItem,
  { reemplazarIndice }: { reemplazarIndice?: number } = {}
): { cart: ArenaCartItem[]; resultado: 'agregada' | 'reemplazada' | 'lleno' } {
  const mismo = cart.findIndex(
    (c, i) => i !== reemplazarIndice && c.field_id === item.field_id && c.fecha === item.fecha
  )

  if (reemplazarIndice !== undefined && cart[reemplazarIndice]) {
    // Al editar, si el nuevo día choca con otra reserva se queda una sola.
    const sin = cart.filter((_, i) => i !== mismo)
    const indice = mismo >= 0 && mismo < reemplazarIndice ? reemplazarIndice - 1 : reemplazarIndice
    return {
      cart: sin.map((c, i) => (i === indice ? item : c)),
      resultado: mismo >= 0 ? 'reemplazada' : 'agregada',
    }
  }

  if (mismo >= 0) {
    return { cart: cart.map((c, i) => (i === mismo ? item : c)), resultado: 'reemplazada' }
  }
  if (cart.length >= MAX_CARRITO) return { cart, resultado: 'lleno' }
  return { cart: [...cart, item], resultado: 'agregada' }
}

export function quitarDelCarrito(cart: ArenaCartItem[], indice: number): ArenaCartItem[] {
  return cart.filter((_, i) => i !== indice)
}

/** Payload de `items` para `POST /arena/checkout`. */
export function itemsParaReserva(
  seleccion: ArenaSeleccion,
  items: ArenaItem[]
): { item_id: string; cantidad?: number }[] {
  return renglones(seleccion, items).map(({ item, cantidad }) =>
    item.es_base || item.unidad === 'por_reserva'
      ? { item_id: item.id }
      : { item_id: item.id, cantidad }
  )
}

/** Payload de `reservas` para `POST /arena/checkout`, desde el carrito. */
export function reservasParaCheckout(
  cart: ArenaCartItem[]
): { field_id: string; fecha: string; num_jugadores: number; items: { item_id: string; cantidad?: number }[] }[] {
  return cart.map((c) => ({
    field_id: c.field_id,
    fecha: c.fecha,
    num_jugadores: c.num_jugadores,
    items: c.lineas.map((l) =>
      l.item_id === c.base_id ? { item_id: l.item_id } : { item_id: l.item_id, cantidad: l.cantidad }
    ),
  }))
}

// ─── Persistencia ────────────────────────────────────────────────────────────

/** Lo que haya en localStorage, saneado: un carrito roto se ignora. */
export function loadCart(): ArenaCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const lista = JSON.parse(raw) as ArenaCartItem[]
    if (!Array.isArray(lista)) return []
    return lista
      .filter((c) => c?.field_id && c?.slug && /^\d{4}-\d{2}-\d{2}$/.test(String(c.fecha)))
      .slice(0, MAX_CARRITO)
      .map((c) => ({
        ...c,
        num_jugadores: Number(c.num_jugadores) || 1,
        base_id: String(c.base_id || ''),
        extras: c.extras && typeof c.extras === 'object' ? c.extras : {},
        lineas: Array.isArray(c.lineas) ? c.lineas : [],
        total_centavos: Number(c.total_centavos) || 0,
      }))
  } catch {
    return []
  }
}

export function saveCart(cart: ArenaCartItem[]): void {
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
