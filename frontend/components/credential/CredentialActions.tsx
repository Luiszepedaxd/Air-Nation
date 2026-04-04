'use client'

import type { RefObject } from 'react'
import { useState } from 'react'
import html2canvas from 'html2canvas'
import type { CredentialUserData } from './CredentialCard'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function safeFilenameAlias(alias: string | null) {
  const base = (alias?.trim() || 'miembro').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 48)
  return base || 'miembro'
}

export function CredentialActions({
  cardRef,
  data,
}: {
  cardRef: RefObject<HTMLDivElement | null>
  data: CredentialUserData
}) {
  const [downloading, setDownloading] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const profileUrl = `https://airnation.online/u/${data.id}`
  const aliasDisplay = data.alias?.trim() || 'miembro'

  const handleDownloadPng = async () => {
    const el = cardRef.current
    if (!el) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `airnation-credencial-${safeFilenameAlias(data.alias)}.png`
      a.click()
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Mi credencial AirNation',
        text: `Soy ${aliasDisplay} en AirNation`,
        url: profileUrl,
      })
    } catch {
      /* usuario canceló o error */
    }
  }

  return (
    <div className="mx-auto mt-6 flex w-full max-w-[360px] flex-col gap-3">
      <button
        type="button"
        disabled={downloading}
        onClick={() => void handleDownloadPng()}
        style={jost}
        className="flex h-12 w-full items-center justify-center gap-2 bg-[#111111] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] disabled:opacity-70 rounded-[2px]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3v12M8 11l4 4 4-4M5 21h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {downloading ? 'GENERANDO...' : 'DESCARGAR PNG'}
      </button>

      {canShare ? (
        <button
          type="button"
          onClick={() => void handleShare()}
          style={jost}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          COMPARTIR
        </button>
      ) : null}

      <div className="mt-2">
        <p style={jost} className="text-[12px] font-extrabold uppercase text-[#666666]">
          GUARDAR EN WALLET
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <button
              type="button"
              disabled
              style={jost}
              className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[11px] font-extrabold uppercase tracking-wide text-[#999999]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#999999"
                  d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C6.808 2 2.182 6.626 2.182 12.182s4.626 10.182 10.363 10.182c5.736 0 10.363-4.626 10.363-10.182 0-.687-.07-1.354-.202-1.995H12.54z"
                />
              </svg>
              GOOGLE WALLET
            </button>
            <p style={lato} className="mt-1 text-center text-[10px] text-[#999999]">
              Próximamente
            </p>
          </div>
          <div>
            <button
              type="button"
              disabled
              style={jost}
              className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[11px] font-extrabold uppercase tracking-wide text-[#999999]"
            >
              <svg width="16" height="18" viewBox="0 0 16 20" fill="none" aria-hidden>
                <path
                  d="M12.64 1.09c-.96-.9-2.52-1.47-4.14-1.47-3.1 0-5.5 2.5-5.5 5.62 0 4.26 4.77 6.68 5.5 10.38.65-3.5 5.5-5.92 5.5-10.38 0-2.02-1.1-3.78-2.36-5.15z"
                  fill="#999999"
                />
              </svg>
              APPLE WALLET
            </button>
            <p style={lato} className="mt-1 text-center text-[10px] text-[#999999]">
              Próximamente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
