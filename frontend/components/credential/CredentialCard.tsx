'use client'

import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const ROLE_LABELS: Record<string, string> = {
  rifleman: 'Jugador',
  sniper: 'Francotirador',
  support: 'Support',
  medic: 'Medic',
  team_leader: 'Líder de equipo',
  scout: 'Scout',
  rookie: 'Rookie',
}

export type CredentialUserData = {
  id: string
  nombre: string | null
  alias: string | null
  ciudad: string | null
  rol: string | null
  avatar_url: string | null
  member_number: string | number | null
  created_at: string
  teamNombre: string | null
}

function rolLabel(rol: string | null) {
  if (!rol) return '—'
  return ROLE_LABELS[rol] || rol
}

function formatMemberNo(n: string | number | null): string {
  if (n == null || String(n).trim() === '') return '—'
  const raw = String(n).trim()
  const num = parseInt(raw.replace(/\D/g, ''), 10)
  if (Number.isNaN(num)) return raw
  return `#${String(num).padStart(6, '0')}`
}

function formatDesde(iso: string) {
  try {
    const d = new Date(iso)
    const meses = [
      'ENE',
      'FEB',
      'MAR',
      'ABR',
      'MAY',
      'JUN',
      'JUL',
      'AGO',
      'SEP',
      'OCT',
      'NOV',
      'DIC',
    ]
    return `${meses[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return ''
  }
}

function AirNationLogoWhite() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#FFFFFF]">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#CC4B37" />
      </svg>
    </span>
  )
}

export const CredentialCard = forwardRef<HTMLDivElement, { data: CredentialUserData }>(
  function CredentialCard({ data }, ref) {
    const alias = data.alias?.trim() || '—'
    const initial = (data.alias?.trim()?.[0] || data.nombre?.trim()?.[0] || '?').toUpperCase()
    const equipoCiudad = [data.teamNombre?.trim() || 'SIN EQUIPO', data.ciudad?.trim() || null]
      .filter(Boolean)
      .join(' · ')
    const memberDisplay = formatMemberNo(data.member_number)
    const verifyUrl = `https://airnation.online/verify/${data.id}`

    return (
      <div
        ref={ref}
        className="w-full max-w-[360px] border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
      >
        <div className="flex items-start justify-between gap-3 bg-[#CC4B37] px-5 py-3 text-[#FFFFFF]">
          <div className="min-w-0">
            <p style={jost} className="text-[14px] font-extrabold uppercase leading-tight">
              AIRNATION
            </p>
            <p
              style={lato}
              className="mt-1 text-[10px] font-normal uppercase tracking-wider text-[#FFFFFF]/80"
            >
              CREDENCIAL DE JUGADOR
            </p>
          </div>
          <AirNationLogoWhite />
        </div>

        <div className="px-5 py-4">
          <div className="flex gap-3">
            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden bg-[#F4F4F4]">
              {data.avatar_url ? (
                <img
                  src={data.avatar_url}
                  alt=""
                  width={72}
                  height={72}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[22px] text-[#111111]"
                  style={jost}
                >
                  {initial}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p style={jost} className="text-[18px] font-extrabold uppercase leading-tight text-[#111111]">
                {alias}
              </p>
              <p
                style={lato}
                className="mt-1 text-[11px] font-normal uppercase tracking-wide text-[#CC4B37]"
              >
                {rolLabel(data.rol)}
              </p>
              <p style={lato} className="mt-1 text-[11px] leading-snug text-[#666666]">
                {equipoCiudad}
              </p>
            </div>
          </div>

          <div className="my-4 border-t border-solid border-[#EEEEEE]" />

          <div className="flex flex-wrap items-end justify-between gap-2">
            <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
              {memberDisplay === '—' ? 'MIEMBRO —' : `MIEMBRO ${memberDisplay}`}
            </p>
            <p style={lato} className="text-[11px] text-[#666666]">
              DESDE: {formatDesde(data.created_at)}
            </p>
          </div>

          <div className="my-4 border-t border-solid border-[#EEEEEE]" />

          <div className="flex justify-end">
            <div className="h-[80px] w-[80px] shrink-0">
              <QRCodeSVG
                value={verifyUrl}
                size={80}
                marginSize={0}
                fgColor="#111111"
                bgColor="#FFFFFF"
                level="M"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-solid border-[#EEEEEE] bg-[#F4F4F4] px-5 py-2">
          <p style={lato} className="text-[10px] leading-relaxed text-[#666666]">
            airnation.online · Verificar: /verify/{data.id}
          </p>
        </div>
      </div>
    )
  }
)

CredentialCard.displayName = 'CredentialCard'
