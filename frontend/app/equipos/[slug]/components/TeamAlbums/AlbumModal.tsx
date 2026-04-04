'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AlbumWithPhotos } from '../../types'

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 6l-6 6 6 6"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 6l6 6-6 6"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export function AlbumModal({
  album,
  open,
  onClose,
}: {
  album: AlbumWithPhotos | null
  open: boolean
  onClose: () => void
}) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (!open) {
      setLightbox(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const urls = (album?.fotos_urls ?? []).filter(Boolean)

  const goPrev = useCallback(() => {
    setLightbox((i) => {
      if (i === null || urls.length === 0) return i
      return i === 0 ? urls.length - 1 : i - 1
    })
  }, [urls.length])

  const goNext = useCallback(() => {
    setLightbox((i) => {
      if (i === null || urls.length === 0) return i
      return i === urls.length - 1 ? 0 : i + 1
    })
  }, [urls.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox !== null) {
          setLightbox(null)
        } else {
          onClose()
        }
        return
      }
      if (lightbox === null) return
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, lightbox, onClose, goPrev, goNext])

  if (!open || !album) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex flex-col bg-[rgba(0,0,0,0.9)]"
        role="dialog"
        aria-modal="true"
        aria-label={album.nombre || 'Álbum'}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <p
            style={jost}
            className="truncate pr-4 text-[14px] font-extrabold uppercase text-white"
          >
            {album.nombre || 'Álbum'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 text-white hover:text-[#CC4B37]"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {urls.map((url, idx) => (
              <button
                key={`${album.id}-${idx}`}
                type="button"
                onClick={() => setLightbox(idx)}
                className="relative aspect-square w-full overflow-hidden bg-[#111111]"
              >
                <img
                  src={url}
                  alt=""
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {lightbox !== null && urls[lightbox] ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[rgba(0,0,0,0.92)]"
          role="presentation"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="absolute left-2 top-1/2 z-[111] -translate-y-1/2 p-3 text-white hover:text-[#CC4B37] md:left-6"
            aria-label="Anterior"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            className="absolute right-2 top-1/2 z-[111] -translate-y-1/2 p-3 text-white hover:text-[#CC4B37] md:right-6"
            aria-label="Siguiente"
          >
            <ChevronRight />
          </button>
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-2 top-4 z-[111] p-2 text-white hover:text-[#CC4B37] md:right-6 md:top-6"
            aria-label="Cerrar vista"
          >
            <CloseIcon />
          </button>
          <div
            className="max-h-[90vh] max-w-[min(100vw-32px,1200px)] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={urls[lightbox]}
              alt=""
              width={1200}
              height={800}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
