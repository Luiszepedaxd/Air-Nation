'use client'

import { useState } from 'react'
import { Lightbox } from '@/components/posts/PhotoGrid'
import { getList, getStr, jost } from './_shared'

export function GaleriaSection({ config }: { config: Record<string, unknown> }) {
  const titulo = getStr(config, 'titulo', 'IMÁGENES DEL EVENTO')
  const imagenes = getList(config, 'imagenes')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (imagenes.length === 0) return null

  return (
    <section className="w-full bg-[#F7F5F3] py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] md:px-10">
        <div className="px-5 md:px-0">
          <h2
            className="text-[1.8rem] leading-[1.05] tracking-[0.02em] text-[#111111] md:text-[3rem]"
            style={jost}
          >
            {titulo}
          </h2>
        </div>

        {/* Mobile: carrusel horizontal — oculto en md+ */}
        <div className="mt-8 md:hidden">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {imagenes.map((url, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setLightboxIdx(i)}
                className="group relative aspect-[3/4] w-[75%] shrink-0 snap-start overflow-hidden bg-[#E5E0DA]"
                aria-label={`Imagen ${i + 1}`}
              >
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  loading="lazy"
                />
              </button>
            ))}
          </div>

          <p
            className="mt-3 px-5 text-center text-[10px] tracking-[0.14em] text-[#999999]"
            style={jost}
          >
            DESLIZA PARA VER TODAS →
          </p>
        </div>

        {/* Desktop: grid como antes */}
        <div className="mt-8 hidden grid-cols-2 gap-1 md:mt-10 md:grid md:grid-cols-3 md:gap-2 lg:grid-cols-4">
          {imagenes.map((url, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setLightboxIdx(i)}
              className="group relative aspect-square overflow-hidden bg-[#E5E0DA]"
              aria-label={`Imagen ${i + 1}`}
            >
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {lightboxIdx !== null && (
          <Lightbox
            urls={imagenes}
            startIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </div>
    </section>
  )
}
