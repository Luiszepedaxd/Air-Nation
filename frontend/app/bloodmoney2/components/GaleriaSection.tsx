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
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <h2
          className="text-[1.8rem] leading-[1.05] tracking-[0.02em] text-[#111111] md:text-[3rem]"
          style={jost}
        >
          {titulo}
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-1 sm:grid-cols-3 md:mt-10 md:gap-2 lg:grid-cols-4">
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
