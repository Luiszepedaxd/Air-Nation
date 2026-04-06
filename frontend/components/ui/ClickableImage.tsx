'use client'

import { useCallback, useState, type ReactNode } from 'react'
import { LightboxPortal } from '@/components/ui/LightboxPortal'

export type ClickableImageProps = {
  src?: string | null
  alt?: string
  className?: string
  width?: number
  height?: number
  children?: ReactNode
}

export function ClickableImage({
  src,
  alt = '',
  className,
  width,
  height,
  children,
}: ClickableImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const trimmed = typeof src === 'string' ? src.trim() : ''
  const hasSrc = trimmed.length > 0

  const close = useCallback(() => setLightboxOpen(false), [])
  const noop = useCallback(() => {}, [])

  if (!hasSrc) {
    return <>{children}</>
  }

  return (
    <>
      <button
        type="button"
        className="block h-full w-full min-h-0 min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left"
        onClick={() => setLightboxOpen(true)}
        aria-label="Ver imagen en grande"
      >
        <img
          src={trimmed}
          alt={alt}
          width={width}
          height={height}
          className={className}
          draggable={false}
        />
      </button>
      {lightboxOpen ? (
        <LightboxPortal
          urls={[trimmed]}
          index={0}
          onClose={close}
          onPrev={noop}
          onNext={noop}
        />
      ) : null}
    </>
  )
}
