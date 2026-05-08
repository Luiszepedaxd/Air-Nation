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
  foto_credencial_url: string | null
  credencial_nombre_completo: string | null
  credencial_fecha_nacimiento: string | null
  member_number: string | number | null
  created_at: string
  teamNombre: string | null
  teamsActivos: string[]
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
  return `${String(num).padStart(6, '0')}`
}

function formatDesde(iso: string) {
  try {
    const d = new Date(iso)
    const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
    return `${meses[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return ''
  }
}

function formatFechaNac(iso: string | null) {
  if (!iso) return ''
  try {
    const d = new Date(iso + 'T00:00:00')
    const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
    const dd = String(d.getDate()).padStart(2, '0')
    return `${dd} · ${meses[d.getMonth()]} · ${d.getFullYear()}`
  } catch {
    return ''
  }
}

function HexLogo() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F4F4F4 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#CC4B37" />
      </svg>
    </span>
  )
}

function ShieldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3L4 7v5c0 4.418 3.358 8.193 8 9 4.642-.807 8-4.582 8-9V7L12 3Z"
        stroke="#CC4B37"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
        stroke="#666666"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" r="2.5" fill="#666666" />
    </svg>
  )
}

export const CredentialCard = forwardRef<HTMLDivElement, { data: CredentialUserData }>(
  function CredentialCard({ data }, ref) {
    const alias = data.alias?.trim() || '—'
    const nombreCompleto = data.credencial_nombre_completo?.trim() || ''
    const initial = (data.alias?.trim()?.[0] || data.nombre?.trim()?.[0] || '?').toUpperCase()
    const ciudadTrim = data.ciudad?.trim() || ''
    const memberDisplay = formatMemberNo(data.member_number)
    const verifyUrl = `https://airnation.online/verify/${data.id}`
    const photoSrc = data.foto_credencial_url || data.avatar_url
    const fechaNacFormatted = formatFechaNac(data.credencial_fecha_nacimiento)
    const desdeFormatted = formatDesde(data.created_at)

    const teamsActivos = (data.teamsActivos || []).filter((t) => t && t.trim().length > 0)
    const teamsToShow = teamsActivos.slice(0, 2)
    const teamsExtraCount = teamsActivos.length - teamsToShow.length

    return (
      <div
        ref={ref}
        className="relative w-full max-w-[340px] bg-[#FFFFFF]"
        style={{
          borderRadius: 14,
          boxShadow:
            '0 30px 60px -20px rgba(204,75,55,0.18), 0 18px 40px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.6)',
          aspectRatio: '5 / 8',
          overflow: 'hidden',
        }}
      >
        {/* Patrón holográfico estático sutil (sin marca de agua) */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'linear-gradient(135deg, rgba(204,75,55,0.04) 0%, transparent 35%, rgba(255,255,255,0) 50%, rgba(204,75,55,0.06) 100%)',
          }}
        />

        <div className="relative flex h-full flex-col">
          {/* HEADER */}
          <div
            className="relative flex items-center justify-between px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #CC4B37 0%, #B33D2C 100%)' }}
          >
            <div className="min-w-0">
              <p
                style={{ ...jost, letterSpacing: '0.18em' }}
                className="text-[14px] font-extrabold uppercase leading-none text-[#FFFFFF]"
              >
                AIRNATION
              </p>
              <p
                style={{ ...lato, letterSpacing: '0.18em' }}
                className="mt-1 text-[8px] uppercase text-[#FFFFFF]/85"
              >
                CREDENCIAL DE JUGADOR · MX
              </p>
            </div>
            <HexLogo />
          </div>

          {/* Banda micro-info */}
          <div className="flex items-center justify-between border-b border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-1.5">
            <span
              style={{ ...lato, letterSpacing: '0.16em' }}
              className="text-[8px] uppercase text-[#666666]"
            >
              ID-MX-{memberDisplay}
            </span>
            <span
              style={{ ...lato, letterSpacing: '0.16em' }}
              className="text-[8px] uppercase text-[#666666]"
            >
              EMITIDA · {desdeFormatted}
            </span>
          </div>

          {/* CUERPO PRINCIPAL */}
          <div className="flex flex-1 flex-col px-4 pt-3.5 pb-3">
            <div className="flex gap-3.5">
              <div
                className="relative shrink-0"
                style={{
                  width: 92,
                  height: 110,
                  background: '#F4F4F4',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                }}
              >
                {photoSrc ? (
                  <img src={photoSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[28px] text-[#111111]"
                    style={jost}
                  >
                    {initial}
                  </div>
                )}
                <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-[#CC4B37]" />
                <span className="pointer-events-none absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-[#CC4B37]" />
                <span className="pointer-events-none absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-[#CC4B37]" />
                <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-[#CC4B37]" />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  style={{ ...lato, letterSpacing: '0.14em' }}
                  className="text-[8px] uppercase text-[#999999]"
                >
                  ALIAS
                </p>
                <p
                  style={jost}
                  className="mt-0.5 truncate text-[18px] font-extrabold uppercase leading-[1.05] text-[#111111]"
                >
                  {alias}
                </p>

                {nombreCompleto ? (
                  <>
                    <p
                      style={{ ...lato, letterSpacing: '0.14em' }}
                      className="mt-2 text-[8px] uppercase text-[#999999]"
                    >
                      NOMBRE
                    </p>
                    <p style={lato} className="truncate text-[12px] leading-tight text-[#111111]">
                      {nombreCompleto}
                    </p>
                  </>
                ) : null}

                <p
                  style={{ ...jost, letterSpacing: '0.12em' }}
                  className="mt-2 text-[10px] font-extrabold uppercase leading-none text-[#CC4B37]"
                >
                  {rolLabel(data.rol)}
                </p>
              </div>
            </div>

            {(teamsToShow.length > 0 || ciudadTrim) ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {teamsToShow.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 border border-solid border-[#EEEEEE] bg-[#FAFAFA] px-1.5 py-0.5"
                    style={{ borderRadius: 2 }}
                  >
                    <ShieldIcon />
                    <span
                      style={{ ...jost, letterSpacing: '0.08em' }}
                      className="text-[10px] font-extrabold uppercase text-[#111111]"
                    >
                      {t}
                    </span>
                  </span>
                ))}
                {teamsExtraCount > 0 ? (
                  <span style={lato} className="text-[10px] text-[#666666]">
                    +{teamsExtraCount}
                  </span>
                ) : null}
                {ciudadTrim ? (
                  <span className="ml-auto inline-flex items-center gap-1">
                    <PinIcon />
                    <span style={lato} className="text-[10px] text-[#666666]">
                      {ciudadTrim}
                    </span>
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Divisor con perforación */}
            <div className="relative my-3.5">
              <div className="border-t border-dashed border-[#DDDDDD]" />
              <span
                className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#F4F4F4]"
                style={{ boxShadow: 'inset 0 0 0 1px #EEEEEE' }}
              />
              <span
                className="absolute -right-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#F4F4F4]"
                style={{ boxShadow: 'inset 0 0 0 1px #EEEEEE' }}
              />
            </div>

            {/* Grid de datos compacto, alineado a izquierda */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div>
                <p
                  style={{ ...lato, letterSpacing: '0.14em' }}
                  className="text-[8px] uppercase text-[#999999]"
                >
                  MIEMBRO
                </p>
                <p
                  style={jost}
                  className="mt-0.5 text-[14px] font-extrabold uppercase leading-none text-[#111111]"
                >
                  #{memberDisplay}
                </p>
              </div>
              <div>
                <p
                  style={{ ...lato, letterSpacing: '0.14em' }}
                  className="text-[8px] uppercase text-[#999999]"
                >
                  DESDE
                </p>
                <p
                  style={jost}
                  className="mt-0.5 text-[14px] font-extrabold uppercase leading-none text-[#111111]"
                >
                  {desdeFormatted}
                </p>
              </div>

              {fechaNacFormatted ? (
                <div className="col-span-2">
                  <p
                    style={{ ...lato, letterSpacing: '0.14em' }}
                    className="text-[8px] uppercase text-[#999999]"
                  >
                    FECHA DE NACIMIENTO
                  </p>
                  <p
                    style={jost}
                    className="mt-0.5 text-[12px] font-extrabold uppercase leading-none text-[#111111]"
                  >
                    {fechaNacFormatted}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Spacer flexible que empuja el QR hacia abajo SIN crear hueco visual */}
            <div className="flex-1 min-h-[8px]" />

            {/* QR centrado dentro del cuerpo */}
            <div className="flex flex-col items-center">
              <div
                className="bg-[#FFFFFF] p-1.5"
                style={{ boxShadow: 'inset 0 0 0 1px #EEEEEE' }}
              >
                <QRCodeSVG
                  value={verifyUrl}
                  size={86}
                  marginSize={0}
                  fgColor="#111111"
                  bgColor="#FFFFFF"
                  level="M"
                />
              </div>
              <p
                style={{ ...lato, letterSpacing: '0.18em' }}
                className="mt-2 text-[7px] uppercase text-[#999999]"
              >
                ESCANEA PARA VERIFICAR
              </p>
            </div>
          </div>

          {/* FOOTER compacto */}
          <div className="border-t border-solid border-[#EEEEEE] bg-[#FAFAFA] px-4 py-2">
            <div className="flex items-center justify-between">
              <p
                style={{ ...jost, letterSpacing: '0.16em' }}
                className="text-[10px] font-extrabold uppercase leading-none text-[#111111]"
              >
                AIRNATION · MX
              </p>
              <p
                style={lato}
                className="text-[9px] leading-none text-[#666666]"
              >
                airnation.online
              </p>
            </div>
            <p
              style={{ ...lato, letterSpacing: '0.18em' }}
              className="mt-1 text-[7px] uppercase leading-none text-[#999999]"
            >
              IDENTIFICACIÓN DE COMUNIDAD · NO OFICIAL
            </p>
          </div>
        </div>
      </div>
    )
  }
)

CredentialCard.displayName = 'CredentialCard'
