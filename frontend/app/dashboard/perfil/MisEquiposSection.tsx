'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const jost700 = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 700,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export type MisEquipoItem = {
  id: string
  nombre: string
  slug: string
  logo_url: string | null
  ciudad: string | null
  rol_plataforma: string | null
  rango_militar: string | null
}

function badgeKind(rol: string | null): 'founder' | 'admin' | 'member' {
  const r = (rol || '').toLowerCase().trim()
  if (r === 'founder') return 'founder'
  if (r === 'admin') return 'admin'
  return 'member'
}

function RoleBadge({ rol }: { rol: string | null }) {
  const k = badgeKind(rol)
  const label =
    k === 'founder' ? 'FUNDADOR' : k === 'admin' ? 'ADMIN' : 'MIEMBRO'
  const cls =
    k === 'founder'
      ? 'bg-[#111111] text-[#FFFFFF]'
      : k === 'admin'
        ? 'border border-solid border-[#111111] bg-transparent text-[#111111]'
        : 'border border-solid border-[#EEEEEE] bg-transparent text-[#444444]'
  return (
    <span
      style={jost}
      className={`inline-block rounded-[2px] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  )
}

function canEditTeam(rol: string | null) {
  const r = (rol || '').toLowerCase().trim()
  return r === 'founder' || r === 'admin'
}

function isFounder(rol: string | null) {
  return (rol || '').toLowerCase().trim() === 'founder'
}

function HexPlaceholder() {
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full text-[#EEEEEE]"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M20 2l16.66 9.6v19.2L20 40.4 3.34 30.8V11.6L20 2z"
        />
      </svg>
    </div>
  )
}

export function MisEquiposSection({
  teams: initialTeams,
  userId,
  variant = 'default',
}: {
  teams: MisEquipoItem[]
  userId: string
  variant?: 'default' | 'tab'
}) {
  const [teams, setTeams] = useState(initialTeams)
  const [leaveConfirmId, setLeaveConfirmId] = useState<string | null>(null)
  const [leavingId, setLeavingId] = useState<string | null>(null)

  useEffect(() => {
    setTeams(initialTeams)
  }, [initialTeams])

  const handleLeave = useCallback(
    async (t: MisEquipoItem) => {
      setLeavingId(t.id)
      try {
        const { error: e1 } = await supabase
          .from('team_members')
          .update({ status: 'inactivo' })
          .eq('team_id', t.id)
          .eq('user_id', userId)

        if (e1) throw e1

        const { error: e2 } = await supabase
          .from('users')
          .update({ team_id: null })
          .eq('id', userId)
          .eq('team_id', t.id)

        if (e2) throw e2

        setTeams((prev) => prev.filter((x) => x.id !== t.id))
        setLeaveConfirmId(null)
      } catch {
        /* noop */
      } finally {
        setLeavingId(null)
      }
    },
    [userId]
  )

  const sectionTop =
    variant === 'tab'
      ? 'mx-auto max-w-[960px]'
      : 'mx-auto mt-8 max-w-[960px] border-t border-solid border-[#EEEEEE] pt-8'

  if (teams.length === 0) {
    return (
      <section className={sectionTop}>
        <h2
          style={jost}
          className="text-[14px] font-extrabold uppercase tracking-wide text-[#111111]"
        >
          Mis equipos
        </h2>
        <p className="mt-2 text-[13px] text-[#666666]" style={lato}>
          Registra tu equipo en AirNation
        </p>
        <Link
          href="/equipos/nuevo"
          style={jost}
          className="mt-6 inline-flex items-center justify-center rounded-[2px] bg-[#CC4B37] px-6 py-3 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
        >
          Crear equipo
        </Link>
      </section>
    )
  }

  return (
    <section className={sectionTop}>
      <h2
        style={jost}
        className="text-[14px] font-extrabold uppercase tracking-wide text-[#111111]"
      >
        Mis equipos
      </h2>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => {
          const initial = (t.nombre?.trim()?.[0] || '?').toUpperCase()
          const showLeave = !isFounder(t.rol_plataforma)
          const busy = leavingId === t.id

          return (
            <li
              key={t.id}
              className="flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
            >
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-[#F4F4F4]">
                  {t.logo_url ? (
                    <img
                      src={t.logo_url}
                      alt=""
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <HexPlaceholder />
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[16px] text-[#CC4B37]"
                        style={jost}
                      >
                        {initial}
                      </span>
                    </>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[15px] text-[#111111]"
                    style={jost700}
                  >
                    {t.nombre}
                  </p>
                  <p className="text-dim mt-0.5 text-xs" style={lato}>
                    {t.ciudad?.trim() || '—'}
                  </p>
                  <div className="mt-2">
                    <RoleBadge rol={t.rol_plataforma} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/equipos/${encodeURIComponent(t.slug)}`}
                  style={jost}
                  className="inline-flex min-h-[40px] w-full items-center justify-center rounded-[2px] bg-[#CC4B37] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
                >
                  Ver equipo
                </Link>
                <div className="flex flex-wrap gap-2">
                  {canEditTeam(t.rol_plataforma) ? (
                    <>
                      <Link
                        href={`/equipos/${encodeURIComponent(t.slug)}/admin`}
                        style={jost}
                        className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] px-2 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#111111] sm:flex-none"
                      >
                        Administrar
                      </Link>
                      <Link
                        href={`/equipos/${encodeURIComponent(t.slug)}/editar`}
                        style={jost}
                        className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#111111] sm:flex-none"
                      >
                        Editar
                      </Link>
                    </>
                  ) : null}
                </div>
                {showLeave ? (
                  <div className="w-full">
                    {leaveConfirmId === t.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className="text-[12px] text-[#111111]"
                          style={lato}
                        >
                          ¿Salir de {t.nombre.trim()}?
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleLeave(t)}
                          style={jost}
                          className="min-h-[32px] bg-[#CC4B37] px-3 text-[10px] font-extrabold uppercase text-[#FFFFFF] disabled:opacity-50"
                        >
                          SÍ
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setLeaveConfirmId(null)}
                          style={jost}
                          className="min-h-[32px] border border-solid border-[#EEEEEE] px-3 text-[10px] font-extrabold uppercase text-[#666666] disabled:opacity-50"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        style={jost}
                        onClick={() => setLeaveConfirmId(t.id)}
                        className="w-full border-0 bg-transparent p-0 text-center text-[11px] font-extrabold uppercase text-[#999999] hover:text-[#666666]"
                      >
                        Salir del equipo
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
