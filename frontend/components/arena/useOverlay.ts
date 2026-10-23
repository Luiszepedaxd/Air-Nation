'use client'

import { useEffect, useRef } from 'react'

/**
 * Hoja de filtros y carrito: Esc cierra, el fondo no hace scroll y el foco
 * vuelve a quien abrió el panel. Devuelve el ref que va en el panel.
 */
export function useOverlay<T extends HTMLElement = HTMLDivElement>(
  abierto: boolean,
  onClose: () => void
) {
  const panel = useRef<T>(null)
  const previo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!abierto) return
    previo.current = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // AppShell hace el scroll en su propio contenedor, no en el body.
    const root = document.getElementById('dashboard-scroll-root') ?? document.body
    const previoOverflow = root.style.overflow
    root.style.overflow = 'hidden'

    panel.current?.querySelector<HTMLElement>('button, a[href], input, select')?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      root.style.overflow = previoOverflow
      previo.current?.focus?.()
    }
  }, [abierto, onClose])

  return panel
}
