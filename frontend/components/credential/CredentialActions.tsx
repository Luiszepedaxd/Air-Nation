'use client'

import Link from 'next/link'
import type { RefObject } from 'react'
import { useState } from 'react'
import html2canvas from 'html2canvas'
import type { CredentialUserData } from './CredentialCard'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

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

      <Link
        href={`/u/${data.id}`}
        style={jost}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
      >
        VER PERFIL PÚBLICO
      </Link>
    </div>
  )
}
