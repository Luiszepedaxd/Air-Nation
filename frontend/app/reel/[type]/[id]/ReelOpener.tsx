'use client'

import { useEffect } from 'react'
import { openReels } from '@/lib/reels'

/**
 * Link público de un reel: al montar abre el modo Reels (capa del layout raíz)
 * en este video. Los crawlers no corren JS, así que se quedan con el HTML
 * estático (thumbnail + metadata) y nada se reproduce.
 * El botón reabre si el usuario cierra el visor y vuelve a esta pantalla.
 */
export function ReelOpener({ src }: { src: string }) {
  useEffect(() => {
    openReels(src)
  }, [src])

  return (
    <button
      type="button"
      onClick={() => openReels(src)}
      className="rounded-full bg-[#CC4B37] px-8 py-3 text-sm font-extrabold uppercase tracking-wide text-white"
      style={{ fontFamily: "'Jost', sans-serif" }}
    >
      Abrir en AirNation
    </button>
  )
}
