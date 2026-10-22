'use client'

import { useRouter } from 'next/navigation'
import type { ArenaItem } from '@/lib/arena-api'
import { agregarItem, cartVacio, loadCart, saveCart } from '@/lib/arena-cart'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

/**
 * Manda un concepto al carrito. El carrito es de un solo campo (una reserva
 * por compra), así que si ya hay otro campo se avisa antes de vaciarlo.
 */
export function AgregarAlCarrito({
  campo,
  item,
}: {
  campo: { field_id: string; slug: string; nombre: string }
  item: ArenaItem
}) {
  const router = useRouter()

  const agregar = () => {
    const actual = loadCart()
    if (actual && actual.field_id !== campo.field_id) {
      const ok = window.confirm(
        `Tu carrito tiene conceptos de ${actual.nombre}. Solo se puede reservar un campo por compra: ¿lo vaciamos?`
      )
      if (!ok) return
    }
    const base =
      actual && actual.field_id === campo.field_id
        ? actual
        : cartVacio(campo, Math.max(item.min_jugadores ?? 4, 1))
    saveCart(agregarItem(base, item))
    router.push('/arena/carrito')
  }

  return (
    <button
      type="button"
      onClick={agregar}
      style={jost}
      className="inline-flex min-h-[44px] items-center justify-center border border-solid border-[#111111] px-4 text-[11px] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
    >
      AGREGAR AL CARRITO
    </button>
  )
}
