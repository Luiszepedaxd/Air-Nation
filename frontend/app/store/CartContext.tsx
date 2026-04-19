'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type CartItem = {
  product_id: string
  nombre: string
  foto_url: string | null
  precio: number
  cantidad: number
  peso_kg: number | null
  largo_cm: number | null
  ancho_cm: number | null
  alto_cm: number | null
}

type CartContextType = {
  items: CartItem[]
  count: number
  total: number
  addItem: (item: Omit<CartItem, 'cantidad'>, cantidad?: number) => void
  removeItem: (product_id: string) => void
  updateCantidad: (product_id: string, cantidad: number) => void
  clearCart: () => void
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'airnation_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, hydrated])

  const addItem = useCallback((item: Omit<CartItem, 'cantidad'>, cantidad = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, cantidad: i.cantidad + cantidad } : i
        )
      }
      return [...prev, { ...item, cantidad }]
    })
    setDrawerOpen(true)
  }, [])

  const removeItem = useCallback((product_id: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== product_id))
  }, [])

  const updateCantidad = useCallback((product_id: string, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== product_id))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.product_id === product_id ? { ...i, cantidad } : i))
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const count = items.reduce((acc, i) => acc + i.cantidad, 0)
  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        addItem,
        removeItem,
        updateCantidad,
        clearCart,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
