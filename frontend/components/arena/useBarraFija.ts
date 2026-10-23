'use client'

import { useEffect, useState } from 'react'

/**
 * Las barras fijas de ARENA (la de reservar y la del total del carrito) viven
 * arriba del BottomNav cuando hay sesión, y pegadas al borde cuando no.
 * Devuelve el `bottom` que les toca, con el área segura de iOS.
 */
export function useBarraFija(): string {
  const [conNav, setConNav] = useState(false)

  useEffect(() => {
    setConNav(Boolean(document.querySelector('[data-bottom-nav]')))
  }, [])

  return conNav
    ? 'calc(3.5rem + env(safe-area-inset-bottom))'
    : 'env(safe-area-inset-bottom)'
}
