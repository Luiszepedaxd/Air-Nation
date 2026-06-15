'use client'

import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { getDomain } from '@/lib/parse-links'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const }
const lato = { fontFamily: "'Lato', sans-serif" }

export function LinkChip({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleOpen = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOpen()
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className="mt-2 w-full flex items-center gap-3 border border-[#EEEEEE] bg-[#F9F9F9] px-3 py-2.5 cursor-pointer transition-colors hover:border-[#DDDDDD] hover:bg-[#F4F4F4]"
    >
      <div className="w-7 h-7 bg-[#CC4B37] flex items-center justify-center shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p style={jost} className="text-[11px] text-[#111111] truncate">
          {getDomain(url)}
        </p>
        <p style={lato} className="text-[11px] text-[#999999] truncate">
          {url}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
        className="shrink-0 p-1.5 text-[#AAAAAA] hover:text-[#111111] transition-colors"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M20 6L9 17l-5-5"
              stroke="#2D6A2D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
            <path
              d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
