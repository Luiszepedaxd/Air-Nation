'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type PostPhotoGalleryProps = {
  urls: string[]
}

export function PostPhotoGallery({ urls }: PostPhotoGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const n = urls.length

  const close = useCallback(() => setLightbox(null), [])

  const prev = useCallback(() => {
    setLightbox((i) => {
      if (i === null || n <= 1) return i
      return i === 0 ? n - 1 : i - 1
    })
  }, [n])

  const next = useCallback(() => {
    setLightbox((i) => {
      if (i === null || n <= 1) return i
      return i === n - 1 ? 0 : i + 1
    })
  }, [n])

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft' && n > 1) prev()
      if (e.key === 'ArrowRight' && n > 1) next()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightbox, n, close, prev, next])

  if (n === 0) return null

  if (n === 1) {
    return (
      <>
        <button
          type="button"
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
          onClick={() => setLightbox(0)}
          aria-label="Ver imagen en grande"
        >
          <div className="aspect-[16/9] w-full max-h-[400px] max-w-full overflow-hidden bg-[#F4F4F4]">
            <img
              src={urls[0]}
              alt=""
              className="h-full w-full min-h-0 min-w-0 object-cover"
              draggable={false}
            />
          </div>
        </button>
        {lightbox !== null ? (
          <LightboxPortal
            urls={urls}
            index={lightbox}
            onClose={close}
            onPrev={prev}
            onNext={next}
          />
        ) : null}
      </>
    )
  }

  return (
    <>
      <div className="grid max-h-[400px] w-full grid-cols-2 gap-[2px] overflow-hidden">
        {urls.slice(0, 4).map((u, idx) => (
          <button
            key={`${u}-${idx}`}
            type="button"
            className="relative aspect-square w-full min-h-0 cursor-pointer overflow-hidden border-0 bg-[#F4F4F4] p-0"
            onClick={() => setLightbox(idx)}
            aria-label={`Ver foto ${idx + 1} en grande`}
          >
            <img
              src={u}
              alt=""
              className="h-full w-full min-h-0 min-w-0 object-cover"
              draggable={false}
            />
          </button>
        ))}
      </div>
      {lightbox !== null ? (
        <LightboxPortal
          urls={urls}
          index={lightbox}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      ) : null}
    </>
  )
}

function LightboxPortal(props: {
  urls: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || typeof document === 'undefined') return null
  return createPortal(<LightboxOverlay {...props} />, document.body)
}

function LightboxOverlay({
  urls,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  urls: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const n = urls.length
  const src = urls[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vista ampliada de foto"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-[10001] border-0 bg-transparent p-2 text-3xl leading-none text-white hover:opacity-80"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
      {n > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-[10001] -translate-y-1/2 border-0 bg-transparent p-3 text-4xl text-white hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            aria-label="Foto anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 z-[10001] -translate-y-1/2 border-0 bg-transparent p-3 text-4xl text-white hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            aria-label="Foto siguiente"
          >
            ›
          </button>
        </>
      ) : null}
      <div
        className="flex max-h-[90vh] max-w-[90vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt=""
          className="max-h-[90vh] max-w-[90vw] object-contain"
          draggable={false}
        />
      </div>
    </div>
  )
}
