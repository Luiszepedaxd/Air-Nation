import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const ROL_LABELS: Record<string, string> = {
  rifleman: 'Jugador',
  sniper: 'Francotirador',
  support: 'Support',
  medic: 'Medic',
  team_leader: 'Líder de equipo',
  scout: 'Scout',
  rookie: 'Rookie',
}

function rolLabel(rol: string | null) {
  if (!rol) return '—'
  return ROL_LABELS[rol] || rol
}

type VerifyUserRow = {
  id: string
  nombre: string | null
  alias: string | null
  ciudad: string | null
  rol: string | null
  avatar_url: string | null
  member_number: string | number | null
  created_at: string
  teams: { nombre: string } | { nombre: string }[] | null
}

async function fetchVerifyUser(id: string): Promise<VerifyUserRow | null> {
  const supabase = createPublicSupabaseClient()
  const { data: row, error } = await supabase
    .from('users')
    .select(
      'id, nombre, alias, ciudad, rol, avatar_url, member_number, created_at, teams(nombre)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !row) return null
  return row as VerifyUserRow
}

function teamNombreFromRow(row: VerifyUserRow): string | null {
  if (!row.teams) return null
  return Array.isArray(row.teams) ? row.teams[0]?.nombre ?? null : row.teams.nombre
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

function formatVerificationInstant(d: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(d)
}

function CheckCircleIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="#2D6A2D" strokeWidth="2" />
      <path
        d="M12 20l5 5 11-11"
        stroke="#2D6A2D"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="19" stroke="#CC4B37" strokeWidth="2" />
      <path
        d="M14 14l12 12M26 14l-12 12"
        stroke="#CC4B37"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const row = await fetchVerifyUser(params.id)
  if (!row) {
    return {
      title: 'Verificación — AirNation',
      description: 'Verificación de credencial AirNation.',
      robots: { index: false, follow: false },
    }
  }
  const alias = row.alias?.trim() || row.nombre?.trim() || 'Jugador'
  const rol = rolLabel(row.rol)
  return {
    title: `${alias} — Verificación AirNation`,
    description: `Jugador verificado en AirNation. Alias: ${alias}, Rol: ${rol}`,
    robots: { index: false, follow: false },
  }
}

export default async function VerifyPlayerPage({
  params,
}: {
  params: { id: string }
}) {
  const row = await fetchVerifyUser(params.id)
  const verifiedAt = new Date()
  const verifiedAtText = formatVerificationInstant(verifiedAt)

  if (!row) {
    return (
      <div className="min-h-screen min-w-[375px] bg-[#F4F4F4] px-6 py-6">
        <div className="mx-auto flex max-w-[440px] flex-col items-center text-center">
          <div className="mt-8 flex flex-col items-center">
            <XCircleIcon />
            <h1
              style={jost}
              className="mt-6 text-[14px] font-extrabold uppercase leading-tight text-[#CC4B37]"
            >
              PERFIL NO ENCONTRADO
            </h1>
            <p style={lato} className="mt-3 max-w-[320px] text-[13px] leading-relaxed text-[#666666]">
              Este código QR no corresponde a ningún jugador registrado.
            </p>
            <Link
              href="/"
              style={jost}
              className="mt-10 flex h-12 w-full max-w-[280px] items-center justify-center bg-[#111111] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] rounded-[2px]"
            >
              IR A AIRNATION.ONLINE
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const teamNombre = teamNombreFromRow(row)
  const aliasDisplay = row.alias?.trim() || row.nombre?.trim() || '—'
  const initial = (row.alias?.trim()?.[0] || row.nombre?.trim()?.[0] || '?').toUpperCase()
  const equipoCiudad = [teamNombre?.trim() || 'SIN EQUIPO', row.ciudad?.trim() || null]
    .filter(Boolean)
    .join(' · ')
  const memberDisplay = formatMemberNo(row.member_number)
  const desdeText = formatDesde(row.created_at)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#F4F4F4] px-6 py-6">
      <div className="mx-auto max-w-[440px]">
        <header className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-5 py-5 text-center">
          <div className="flex justify-center">
            <CheckCircleIcon />
          </div>
          <h1
            style={jost}
            className="mt-4 text-[14px] font-extrabold uppercase leading-tight text-[#2D6A2D]"
          >
            IDENTIDAD VERIFICADA
          </h1>
          <p style={lato} className="mt-2 text-[13px] leading-relaxed text-[#666666]">
            Este perfil pertenece a un jugador
            <br />
            registrado en AirNation
          </p>
        </header>

        <section className="mt-6 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-6 py-6">
          <div className="h-[96px] w-[96px] overflow-hidden bg-[#F4F4F4]">
            {row.avatar_url ? (
              <img
                src={row.avatar_url}
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-[28px] text-[#111111]"
                style={jost}
              >
                {initial}
              </div>
            )}
          </div>

          <h2
            style={jost}
            className="mt-12 text-[24px] font-extrabold uppercase leading-tight text-[#111111]"
          >
            {aliasDisplay}
          </h2>
          <p
            style={lato}
            className="mt-2 text-[13px] font-normal uppercase tracking-wide text-[#CC4B37]"
          >
            {rolLabel(row.rol)}
          </p>
          <p style={lato} className="mt-2 text-[13px] leading-relaxed text-[#666666]">
            {equipoCiudad}
          </p>

          <div className="my-16 border-t border-solid border-[#EEEEEE]" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">
              {memberDisplay === '—' ? 'MIEMBRO —' : `MIEMBRO ${memberDisplay}`}
            </p>
            <span
              style={lato}
              className="inline-block border border-solid border-[#2D6A2D] bg-[#F0FFF0] px-8 py-2 text-[11px] font-normal uppercase text-[#2D6A2D]"
            >
              ACTIVO
            </span>
          </div>
          <p style={lato} className="mt-4 text-[12px] text-[#666666]">
            DESDE: {desdeText}
          </p>
        </section>

        <footer style={lato} className="mt-24 text-center text-[11px] leading-relaxed text-[#999999]">
          Verificado por AirNation · airnation.online
          <br />
          {verifiedAtText}
        </footer>
      </div>
    </div>
  )
}
