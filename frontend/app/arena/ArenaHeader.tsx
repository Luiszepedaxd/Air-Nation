'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useArenaCart } from '@/components/arena/ArenaCartProvider'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800 } as const

/**
 * Barra de ARENA con el botón del carrito y su contador. La navegación del
 * sitio ya la pone AppShell (y la app nativa su BottomNav): aquí solo va lo
 * propio del marketplace.
 */
export function ArenaHeader() {
  const { cart, listo, abrir } = useArenaCart()
  const n = cart.length
  const [brinca, setBrinca] = useState(false)

  // El contador brinca cuando cambia: es la única animación del header.
  useEffect(() => {
    if (!listo || n === 0) return
    setBrinca(true)
    const t = setTimeout(() => setBrinca(false), 450)
    return () => clearTimeout(t)
  }, [n, listo])

  return (
    <header className="sticky top-0 z-40 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF]">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center gap-4 px-4 md:px-6">
        <Link href="/arena" className="flex items-center gap-2 no-underline">
          <span style={jost} className="border border-solid border-[#111111] px-[7px] py-[3px] text-[12px] tracking-[0.14em] text-[#111111]">
            ARENA
          </span>
        </Link>
        <Link
          href="/campos"
          style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600 }}
          className="hidden px-2.5 py-2 text-[13px] text-[#666666] no-underline hover:text-[#111111] sm:block"
        >
          Directorio de campos
        </Link>

        <button
          type="button"
          onClick={abrir}
          aria-label={`Abrir carrito, ${n} ${n === 1 ? 'reserva' : 'reservas'}`}
          style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700 }}
          className="ml-auto inline-flex h-10 items-center gap-2 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 text-[13px] text-[#111111] hover:border-[#CCCCCC]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="9.5" cy="19.5" r="1.5" fill="currentColor" />
            <circle cx="17" cy="19.5" r="1.5" fill="currentColor" />
          </svg>
          <span>Carrito</span>
          <span
            className={`inline-grid h-5 min-w-5 place-items-center rounded-[10px] px-1.5 text-[11px] transition-transform motion-reduce:transition-none ${
              n > 0 ? 'bg-[#CC4B37] text-[#FFFFFF]' : 'bg-[#F4F4F4] text-[#666666]'
            } ${brinca ? 'scale-125' : 'scale-100'}`}
          >
            {listo ? n : 0}
          </span>
        </button>
      </div>
    </header>
  )
}
