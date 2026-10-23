import test from 'node:test'
import assert from 'node:assert/strict'
import type { ArenaItem } from './arena-api'
import {
  aItemDeCarrito,
  cantidadDe,
  itemsParaReserva,
  MAX_CARRITO,
  quitarDelCarrito,
  renglones,
  reservasParaCheckout,
  totalCarrito,
  totalSeleccion,
  upsertCarrito,
  type ArenaCartItem,
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
    disciplina: null,
    duracion_min: null,
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
const renta = item({ id: 'renta', tipo: 'renta', es_base: false, unidad: 'por_unidad', precio_centavos: 15000 })
const foto = item({ id: 'foto', tipo: 'extra', es_base: false, unidad: 'por_reserva', precio_centavos: 30000 })
const bebida = item({ id: 'bebida', tipo: 'extra', es_base: false, unidad: 'por_persona', precio_centavos: 4500 })
const CATALOGO = [paquete, renta, foto, bebida]

const CAMPO = {
  field_id: 'f1',
  slug: 'bunker-47',
  nombre: 'Bunker 47',
  ciudad: 'Zapopan',
  foto_portada_url: null,
}

const seleccion = (extra = {}) => ({
  fecha: '2026-10-24',
  num_jugadores: 4,
  base_id: 'base',
  extras: {},
  ...extra,
})

test('las cantidades siguen las reglas de la BD', () => {
  // Base por persona: siempre cobra por los jugadores, no por lo elegido.
  assert.equal(cantidadDe(paquete, 1, 4), 4)
  // Extra por persona: tope en los jugadores.
  assert.equal(cantidadDe(bebida, 9, 4), 4)
  // Por reserva: siempre 1. Por unidad: lo que pidió, mínimo 1.
  assert.equal(cantidadDe(foto, 5, 4), 1)
  assert.equal(cantidadDe(renta, 3, 4), 3)
  assert.equal(cantidadDe(renta, 0, 4), 1)
})

test('el total de una selección suma paquete, rentas y extras', () => {
  const s = seleccion({ extras: { renta: 2, foto: 1, bebida: 4 } })
  assert.deepEqual(
    renglones(s, CATALOGO).map((r) => [r.item.id, r.cantidad, r.subtotal_centavos]),
    [
      ['base', 4, 140000],
      ['renta', 2, 30000],
      ['foto', 1, 30000],
      ['bebida', 4, 18000],
    ]
  )
  assert.equal(totalSeleccion(s, CATALOGO), 218000)
  // Un concepto que ya no está en el catálogo se cae solo.
  assert.equal(totalSeleccion(seleccion({ extras: { fantasma: 3 } }), CATALOGO), 140000)
})

test('el payload para el backend solo lleva ids y cantidades', () => {
  assert.deepEqual(itemsParaReserva(seleccion({ extras: { renta: 2, foto: 1 } }), CATALOGO), [
    { item_id: 'base' },
    { item_id: 'renta', cantidad: 2 },
    { item_id: 'foto' },
  ])
})

test('el mismo campo y día se reemplaza; la reserva 11 se rechaza', () => {
  const uno = aItemDeCarrito(CAMPO, seleccion(), CATALOGO)
  const mismoDia = aItemDeCarrito(CAMPO, seleccion({ num_jugadores: 8 }), CATALOGO)
  const otroDia = aItemDeCarrito(CAMPO, seleccion({ fecha: '2026-10-25' }), CATALOGO)

  const a = upsertCarrito([], uno)
  assert.equal(a.resultado, 'agregada')
  assert.equal(totalCarrito(a.cart), 140000)

  const b = upsertCarrito(a.cart, mismoDia)
  assert.equal(b.resultado, 'reemplazada')
  assert.equal(b.cart.length, 1)
  assert.equal(b.cart[0].num_jugadores, 8)

  const c = upsertCarrito(b.cart, otroDia)
  assert.equal(c.resultado, 'agregada')
  assert.equal(c.cart.length, 2)

  const lleno: ArenaCartItem[] = Array.from({ length: MAX_CARRITO }, (_, i) =>
    aItemDeCarrito(CAMPO, seleccion({ fecha: `2026-11-${String(i + 1).padStart(2, '0')}` }), CATALOGO)
  )
  assert.equal(upsertCarrito(lleno, aItemDeCarrito(CAMPO, seleccion({ fecha: '2026-12-01' }), CATALOGO)).resultado, 'lleno')
  // Reemplazar una fecha que ya está en un carrito lleno sí pasa.
  assert.equal(upsertCarrito(lleno, aItemDeCarrito(CAMPO, seleccion({ fecha: '2026-11-01' }), CATALOGO)).resultado, 'reemplazada')
})

test('editar conserva la reserva y colapsa un choque de día', () => {
  const dia24 = aItemDeCarrito(CAMPO, seleccion(), CATALOGO)
  const dia25 = aItemDeCarrito(CAMPO, seleccion({ fecha: '2026-10-25' }), CATALOGO)
  const cart = [dia24, dia25]

  // Editar la reserva 1 (índice 1) sin cambiar el día: sigue siendo la misma.
  const editada = upsertCarrito(
    cart,
    aItemDeCarrito(CAMPO, seleccion({ fecha: '2026-10-25', num_jugadores: 10 }), CATALOGO),
    { reemplazarIndice: 1 }
  )
  assert.equal(editada.cart.length, 2)
  assert.equal(editada.cart[1].num_jugadores, 10)
  assert.equal(editada.cart[0].fecha, '2026-10-24')

  // Editar la reserva 1 y moverla al día de la 0: queda una sola.
  const choque = upsertCarrito(cart, aItemDeCarrito(CAMPO, seleccion({ num_jugadores: 6 }), CATALOGO), {
    reemplazarIndice: 1,
  })
  assert.equal(choque.cart.length, 1)
  assert.equal(choque.cart[0].num_jugadores, 6)
  assert.equal(choque.resultado, 'reemplazada')
})

test('el carrito se traduce a las reservas de POST /arena/checkout', () => {
  const cart = [
    aItemDeCarrito(CAMPO, seleccion({ extras: { renta: 2 } }), CATALOGO),
    aItemDeCarrito(CAMPO, seleccion({ fecha: '2026-10-25' }), CATALOGO),
  ]
  assert.deepEqual(reservasParaCheckout(cart), [
    {
      field_id: 'f1',
      fecha: '2026-10-24',
      num_jugadores: 4,
      items: [{ item_id: 'base' }, { item_id: 'renta', cantidad: 2 }],
    },
    { field_id: 'f1', fecha: '2026-10-25', num_jugadores: 4, items: [{ item_id: 'base' }] },
  ])
  assert.equal(quitarDelCarrito(cart, 0).length, 1)
})
