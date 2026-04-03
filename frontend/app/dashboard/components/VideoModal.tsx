'use client'

import { useEffect } from 'react'

const jostTitle = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

type Props = {
  videoId: string
  title: string
  onClose: () => void
}

export function VideoModal({ videoId, title, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-[900px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-0 top-0 z-10 flex h-8 w-8 items-center justify-center bg-[#111111] text-[#FFFFFF]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h2
          id="video-modal-title"
          style={jostTitle}
          className="mb-2 pr-10 text-[14px] leading-tight text-[#FFFFFF]"
        >
          {title}
        </h2>
        <div className="aspect-video w-full overflow-hidden bg-black">
          <iframe
            title={title}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            width="100%"
            height="100%"
            className="h-full w-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        </div>
      </div>
    </div>
  )
}
