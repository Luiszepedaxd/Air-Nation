'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type LightboxPortalProps = {
  urls: string[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function LightboxPortal(props: LightboxPortalProps) {
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
}: LightboxPortalProps) {
  const n = urls.length
  const src = urls[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && n > 1) onPrev()
      if (e.key === 'ArrowRight' && n > 1) onNext()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [n, onClose, onPrev, onNext])

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
        className="absolute right-4 top-4 z-[10001] border-0 bg-transparent p-2 text-white hover:opacity-80"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Cerrar"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {n > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-[10001] -translate-y-1/2 border-0 bg-transparent p-3 text-white hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            aria-label="Foto anterior"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M14 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 z-[10001] -translate-y-1/2 border-0 bg-transparent p-3 text-white hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            aria-label="Foto siguiente"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M10 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
