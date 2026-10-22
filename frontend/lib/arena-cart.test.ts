import test from 'node:test'
import assert from 'node:assert/strict'
import type { ArenaItem } from './arena-api'
import {
  agregarItem,
  cartVacio,
  itemsParaReserva,
  quitarItem,
  renglonesCart,
  totalCart,
} from './arena-cart'

function item(extra: Partial<ArenaItem>): ArenaItem {
  return {
    id: 'i1',
    field_id: 'f1',
    tipo: 'paquete',
    es_base: true,
    nombre: 'Paquete',
    descripcion: null,
    incluye: [],
    precio_centavos: 35000,
    unidad: 'por_persona',
    min_jugadores: null,
    max_jugadores: null,
    max_por_reserva: null,
    fotos_urls: [],
    activo: true,
    orden: 0,
    ...extra,
  }
}

const paquete = item({ id: 'base' })
const renta = item({ id: 'renta', tipo: 'renta', es_base: false, precio_centavos: 15000 })
const transporte = item({
  id: 'transporte',
  tipo: 'extra',
  es_base: false,
  unidad: 'por_reserva',
  precio_centavos: 50000,
})
const catalogo = [paquete, renta, transporte]

test('el paquete base se cobra por jugador y los extras por su cantidad', () => {
  let cart = cartVacio({ field_id: 'f1', slug: 'campo', nombre: 'Campo' })
  cart = { ...agregarItem(cart, paquete), num_jugadores: 6 }
  cart = agregarItem(cart, renta, 2)
  cart = agregarItem(cart, transporte, 9)

  const renglones = renglonesCart(cart, catalogo)
  assert.deepEqual(
    renglones.map((r) => [r.item.id, r.cantidad]),
    [
      ['base', 6],
      ['renta', 2],
      // `por_reserva` siempre se cobra una vez, aunque el cliente pida 9.
      ['transporte', 1],
    ]
  )
  assert.equal(totalCart(cart, catalogo), 35000 * 6 + 15000 * 2 + 50000)

  // El backend recalcula precios: solo viajan ids y cantidades.
  assert.deepEqual(itemsParaReserva(cart, catalogo), [
    { item_id: 'base' },
    { item_id: 'renta', cantidad: 2 },
    { item_id: 'transporte' },
  ])
})

test('solo cabe un paquete base y quitar un concepto lo saca del total', () => {
  const otroPaquete = item({ id: 'base2', precio_centavos: 50000 })
  let cart = cartVacio({ field_id: 'f1', slug: 'campo', nombre: 'Campo' })
  cart = agregarItem(cart, paquete)
  cart = agregarItem(cart, otroPaquete)
  assert.equal(cart.base_id, 'base2')

  cart = agregarItem(cart, renta, 1)
  cart = quitarItem(cart, 'renta')
  assert.deepEqual(cart.extras, {})
  assert.equal(totalCart({ ...cart, num_jugadores: 1 }, [...catalogo, otroPaquete]), 50000)
})

test('una renta por persona nunca se cobra más veces que jugadores', () => {
  let cart = cartVacio({ field_id: 'f1', slug: 'campo', nombre: 'Campo' }, 3)
  cart = agregarItem(cart, renta, 10)
  assert.equal(renglonesCart(cart, catalogo)[0].cantidad, 3)
})
