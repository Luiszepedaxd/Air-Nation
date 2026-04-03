'use client'

import { useCallback, useState } from 'react'

const jostBtn = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export function BlogShareButton() {
  const [label, setLabel] = useState('COPIAR ENLACE')

  const copy = useCallback(() => {
    if (typeof window === 'undefined') return
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setLabel('¡ENLACE COPIADO!')
      window.setTimeout(() => setLabel('COPIAR ENLACE'), 2000)
    })
  }, [])

  return (
    <button
      type="button"
      onClick={copy}
      style={jostBtn}
      className="min-h-[44px] bg-[#111111] px-5 py-2.5 text-[12px] text-[#FFFFFF] transition-opacity hover:opacity-90"
    >
      {label}
    </button>
  )
}
