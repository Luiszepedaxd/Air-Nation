'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearCart,
  loadCart,
  MAX_CARRITO,
  quitarDelCarrito,
  saveCart,
  totalCarrito,
  upsertCarrito,
  type ArenaCartItem,
} from '@/lib/arena-cart'

type ArenaCartCtx = {
  cart: ArenaCartItem[]
  /** false hasta leer localStorage: el contador no parpadea al hidratar. */
  listo: boolean
  total: number
  aviso: string
  limpiarAviso: () => void
  agregar: (
    item: ArenaCartItem,
    opts?: { reemplazarIndice?: number }
  ) => 'agregada' | 'reemplazada' | 'lleno'
  quitar: (indice: number) => void
  vaciar: () => void
  abierto: boolean
  abrir: () => void
  cerrar: () => void
}

const Ctx = createContext<ArenaCartCtx | null>(null)

/** El carrito es del cliente hasta pagar: aquí no se crea nada en la BD. */
export function ArenaCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ArenaCartItem[]>([])
  const [listo, setListo] = useState(false)
  const [abierto, setAbierto] = useState(false)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    setCart(loadCart())
    setListo(true)
  }, [])

  const guardar = useCallback((siguiente: ArenaCartItem[]) => {
    setCart(siguiente)
    saveCart(siguiente)
  }, [])

  const agregar = useCallback<ArenaCartCtx['agregar']>(
    (item, opts) => {
      const { cart: siguiente, resultado } = upsertCarrito(loadCart(), item, opts ?? {})
      if (resultado === 'lleno') {
        setAviso(`Tu carrito ya tiene ${MAX_CARRITO} reservas. Paga o quita alguna para agregar otra.`)
        return resultado
      }
      guardar(siguiente)
      setAviso(
        resultado === 'reemplazada'
          ? `Actualizamos tu reserva en ${item.nombre} para ese día.`
          : `Agregamos ${item.nombre} a tu carrito.`
      )
      return resultado
    },
    [guardar]
  )

  const valor = useMemo<ArenaCartCtx>(
    () => ({
      cart,
      listo,
      total: totalCarrito(cart),
      aviso,
      limpiarAviso: () => setAviso(''),
      agregar,
      quitar: (indice) => guardar(quitarDelCarrito(loadCart(), indice)),
      vaciar: () => {
        clearCart()
        setCart([])
      },
      abierto,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
    }),
    [cart, listo, aviso, abierto, agregar, guardar]
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useArenaCart(): ArenaCartCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useArenaCart necesita <ArenaCartProvider>')
  return ctx
}
