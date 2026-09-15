'use client'

import { useCallback, useState } from 'react'

const jostBtn = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export function CampoShareButton({
  nombre,
  slug,
}: {
  nombre: string
  slug: string
}) {
  const [label, setLabel] = useState('COMPARTIR')

  const handleShare = useCallback(async () => {
    const url = `https://www.airnation.online/campos/${slug}`
    const title = `${nombre} — AirNation`

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: nombre, url })
      } catch (err) {
        // Ignore user cancel / AbortError; do not fall through to clipboard
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setLabel('¡COPIADO!')
      window.setTimeout(() => setLabel('COMPARTIR'), 2000)
    } catch {
      /* noop */
    }
  }, [nombre, slug])

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      style={jostBtn}
      className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 border border-solid border-[#111111] bg-[#FFFFFF] px-4 py-2.5 text-[11px] tracking-[0.12em] text-[#111111] transition-opacity hover:opacity-90"
      aria-label="Compartir campo"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12M8 7l4-4 4 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  )
}
