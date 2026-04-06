'use client'

import { useState } from 'react'
import type { AlbumWithPhotos } from '../types'
import { AlbumModal } from './TeamAlbums/AlbumModal'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function ImagePlaceholderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h16v14H4V5z"
        stroke="#AAAAAA"
        strokeWidth="1.4"
      />
      <path
        d="M8 14l2.5-3 2 2.5L17 10l3 4v3H4v-4l4-3z"
        stroke="#AAAAAA"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="1.5" fill="#AAAAAA" />
    </svg>
  )
}

export function TeamAlbums({
  albums,
  variant = 'section',
}: {
  albums: AlbumWithPhotos[]
  variant?: 'section' | 'tab'
}) {
  const [active, setActive] = useState<AlbumWithPhotos | null>(null)

  if (!albums.length) {
    if (variant === 'tab') {
      return (
        <p className="text-sm text-dim" style={lato}>
          No hay álbumes aún.
        </p>
      )
    }
    return null
  }

  return (
    <section
      className={
        variant === 'section'
          ? 'mx-auto w-full max-w-[960px] px-4 py-8'
          : 'w-full'
      }
    >
      {variant === 'section' ? (
        <h2
          style={jost}
          className="mb-6 text-[14px] font-extrabold uppercase tracking-wide text-[#111111] md:text-[16px]"
        >
          Álbumes
        </h2>
      ) : null}

      <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {albums.map((album) => {
          const urls = album.fotos_urls
          const cover = urls[0]
          const count = urls.length

          return (
            <button
              key={album.id}
              type="button"
              onClick={() => setActive(album)}
              className="flex w-[min(72vw,240px)] shrink-0 flex-col border border-[#EEEEEE] bg-[#FFFFFF] text-left md:w-auto"
            >
              <div className="aspect-square w-full overflow-hidden bg-[#F4F4F4]">
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    width={400}
                    height={400}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImagePlaceholderIcon />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p
                  style={jost}
                  className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]"
                >
                  {album.nombre || 'Álbum'}
                </p>
                <p
                  className="mt-1 text-[12px] text-[#666666]"
                  style={lato}
                >
                  {count} {count === 1 ? 'foto' : 'fotos'}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <AlbumModal
        album={active}
        open={active !== null}
        onClose={() => setActive(null)}
      />
    </section>
  )
}
