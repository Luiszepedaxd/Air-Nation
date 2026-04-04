'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type PostPhotoGalleryProps = {
  urls: string[]
  /**
   * `post`: layouts compactos (máx. 4 fotos).
   * `campo`: grid 2 cols móvil / 3 desktop, thumbnails cuadrados, todas las URLs (hasta maxPhotos).
   */
  variant?: 'post' | 'campo'
  /** Límite de fotos en la cuadrícula (por defecto 4 en post, 24 en campo). */
  maxPhotos?: number
}

export function PostPhotoGallery({
  urls,
  variant = 'post',
  maxPhotos,
}: PostPhotoGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const cleaned = urls.filter((u) => typeof u === 'string' && u.trim().length > 0)
  const cap =
    maxPhotos ??
    (variant === 'campo' ? 24 : 4)
  const list = cleaned.slice(0, cap)
  const n = list.length

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

  const open = (idx: number) => setLightbox(idx)

  if (variant === 'campo') {
    const lightboxNodeCampo =
      lightbox !== null ? (
        <LightboxPortal
          urls={list}
          index={lightbox}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      ) : null
    return (
      <>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {list.map((u, idx) => (
            <button
              key={`${u}-${idx}`}
              type="button"
              className="aspect-square w-full cursor-pointer overflow-hidden border-0 bg-[#F4F4F4] p-0"
              onClick={() => open(idx)}
              aria-label={`Ver foto ${idx + 1} en grande`}
            >
              <img
                src={u}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
        {lightboxNodeCampo}
      </>
    )
  }

  const lightboxNode =
    lightbox !== null ? (
      <LightboxPortal
        urls={list}
        index={lightbox}
        onClose={close}
        onPrev={prev}
        onNext={next}
      />
    ) : null

  if (n === 1) {
    return (
      <>
        <button
          type="button"
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
          onClick={() => open(0)}
          aria-label="Ver imagen en grande"
        >
          <div className="h-[280px] w-full max-h-[280px] overflow-hidden bg-[#F4F4F4]">
            <img
              src={list[0]}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        </button>
        {lightboxNode}
      </>
    )
  }

  if (n === 2) {
    return (
      <>
        <div className="grid w-full grid-cols-2 gap-[2px]">
          {list.map((u, idx) => (
            <button
              key={`${u}-${idx}`}
              type="button"
              className="h-[160px] w-full cursor-pointer overflow-hidden border-0 bg-[#F4F4F4] p-0"
              onClick={() => open(idx)}
              aria-label={`Ver foto ${idx + 1} en grande`}
            >
              <img
                src={u}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
        {lightboxNode}
      </>
    )
  }

  if (n === 3) {
    return (
      <>
        <div className="flex w-full flex-col gap-[2px]">
          <button
            type="button"
            className="h-[160px] w-full cursor-pointer overflow-hidden border-0 bg-[#F4F4F4] p-0"
            onClick={() => open(0)}
            aria-label="Ver foto 1 en grande"
          >
            <img
              src={list[0]}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          </button>
          <div className="grid w-full grid-cols-2 gap-[2px]">
            <button
              type="button"
              className="h-[100px] w-full cursor-pointer overflow-hidden border-0 bg-[#F4F4F4] p-0"
              onClick={() => open(1)}
              aria-label="Ver foto 2 en grande"
            >
              <img
                src={list[1]}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </button>
            <button
              type="button"
              className="h-[100px] w-full cursor-pointer overflow-hidden border-0 bg-[#F4F4F4] p-0"
              onClick={() => open(2)}
              aria-label="Ver foto 3 en grande"
            >
              <img
                src={list[2]}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            </button>
          </div>
        </div>
        {lightboxNode}
      </>
    )
  }

  return (
    <>
      <div className="grid w-full grid-cols-2 gap-[2px]">
        {list.map((u, idx) => (
          <button
            key={`${u}-${idx}`}
            type="button"
            className="h-[140px] w-full cursor-pointer overflow-hidden border-0 bg-[#F4F4F4] p-0"
            onClick={() => open(idx)}
            aria-label={`Ver foto ${idx + 1} en grande`}
          >
            <img
              src={u}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          </button>
        ))}
      </div>
      {lightboxNode}
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
