'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { notifyPendingJoinUpdated } from '@/lib/pending-join-requests'
import { supabase } from '@/lib/supabase'
import type {
  TeamJoinRequestAdminRow,
  TeamMemberAdminRow,
} from './types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

const RANGO_OPTIONS = [
  'fundador',
  'capitan',
  'lider_escuadra',
  'miembro',
] as const

type TabId = 'solicitudes' | 'integrantes' | 'perfil'

function relativeTime(iso: string): string {
  try {
    const t = new Date(iso).getTime()
    const diff = Date.now() - t
    const h = Math.floor(diff / (60 * 60 * 1000))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch {
    return ''
  }
}

function initialFromUser(nombre: string | null, alias: string | null) {
  const s =
    alias?.trim()?.[0] || nombre?.trim()?.[0] || '?'
  return s.toUpperCase()
}

function isFounderRol(rol: string | null | undefined) {
  return (rol || '').toLowerCase() === 'founder'
}

function rolBadgeLabel(rol: string | null | undefined) {
  const r = (rol || '').toLowerCase()
  if (r === 'founder') return 'FUNDADOR'
  if (r === 'admin') return 'ADMIN'
  return 'MIEMBRO'
}

function formatRangoBadge(rango: string | null | undefined) {
  if (!rango) return ''
  return rango.replace(/_/g, ' ').toUpperCase()
}

export function AdminClient({
  slug,
  teamId,
  teamNombre,
  teamCiudad,
  logoUrl,
  viewerUserId,
  viewerRol,
  initialJoinRequests,
  initialMembers,
}: {
  slug: string
  teamId: string
  viewerUserId: string
  viewerRol: string
  teamNombre: string
  teamCiudad: string | null
  logoUrl: string | null
  initialJoinRequests: TeamJoinRequestAdminRow[]
  initialMembers: TeamMemberAdminRow[]
}) {
  const [activeTab, setActiveTab] = useState<TabId>('solicitudes')
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests)
  const [members, setMembers] = useState(initialMembers)
  const pendingCount = joinRequests.length

  const viewerIsFounder = isFounderRol(viewerRol)
  const viewerIsAdmin = (viewerRol || '').toLowerCase() === 'admin'

  const tabClass = (tabId: TabId) =>
    activeTab === tabId
      ? 'border-b-2 border-[#CC4B37] text-[#111111] pb-[14px] px-4'
      : 'border-b-2 border-transparent text-[#666666] pb-[14px] px-4'

  const removeRequest = useCallback((id: string) => {
    setJoinRequests((r) => r.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    const el = document.getElementById('dashboard-scroll-root')
    el?.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <div className="mb-6">
        <Link
          href={`/equipos/${encodeURIComponent(slug)}`}
          className="inline-flex items-center gap-1 text-[13px] text-[#666666] transition-colors hover:text-[#111111]"
          style={lato}
        >
          <span aria-hidden>←</span>
          <span className="font-semibold text-[#111111]">{teamNombre}</span>
        </Link>
      </div>

      <h1
        style={jost}
        className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]"
      >
        ADMINISTRAR
      </h1>

      <div className="sticky top-0 z-40 -mx-4 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] md:-mx-6">
        <div className="flex overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('solicitudes')}
            style={jost}
            className={`${tabBase} ${tabClass('solicitudes')} inline-flex items-center gap-1.5`}
          >
            <span>SOLICITUDES</span>
            {pendingCount > 0 ? (
              <span
                style={jost}
                className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#CC4B37] px-1 text-[10px] font-extrabold leading-none text-[#FFFFFF]"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrantes')}
            style={jost}
            className={`${tabBase} ${tabClass('integrantes')}`}
          >
            INTEGRANTES
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            style={jost}
            className={`${tabBase} ${tabClass('perfil')}`}
          >
            PERFIL DEL EQUIPO
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'solicitudes' ? (
          <SolicitudesTab
            teamId={teamId}
            joinRequests={joinRequests}
            onRemove={removeRequest}
          />
        ) : null}

        {activeTab === 'integrantes' ? (
          <IntegrantesTab
            teamId={teamId}
            members={members}
            setMembers={setMembers}
            viewerUserId={viewerUserId}
            viewerIsFounder={viewerIsFounder}
            viewerIsAdmin={viewerIsAdmin}
          />
        ) : null}

        {activeTab === 'perfil' ? (
          <PerfilEquipoTab
            slug={slug}
            teamNombre={teamNombre}
            teamCiudad={teamCiudad}
            logoUrl={logoUrl}
          />
        ) : null}
      </div>
    </main>
  )
}

function SolicitudesTab({
  teamId,
  joinRequests,
  onRemove,
}: {
  teamId: string
  joinRequests: TeamJoinRequestAdminRow[]
  onRemove: (id: string) => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleApprove = async (row: TeamJoinRequestAdminRow) => {
    setBusyId(row.id)
    try {
      const { error: uErr } = await supabase
        .from('team_join_requests')
        .update({ status: 'aprobado' })
        .eq('id', row.id)

      if (uErr) throw uErr

      const { error: iErr } = await supabase.from('team_members').insert({
        team_id: teamId,
        user_id: row.user_id,
        rol_plataforma: 'member',
        rango_militar: 'miembro',
        status: 'activo',
      })

      if (iErr) throw iErr

      onRemove(row.id)
      notifyPendingJoinUpdated()
    } catch {
      /* keep row */
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (row: TeamJoinRequestAdminRow) => {
    setBusyId(row.id)
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .update({ status: 'rechazado' })
        .eq('id', row.id)

      if (error) throw error

      onRemove(row.id)
      notifyPendingJoinUpdated()
    } catch {
      /* keep row */
    } finally {
      setBusyId(null)
    }
  }

  if (joinRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p
          style={lato}
          className="text-[14px] text-[#666666]"
        >
          No hay solicitudes pendientes
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4 pb-10">
      {joinRequests.map((row) => {
        const name =
          row.nombre?.trim() || row.alias?.trim() || 'Usuario'
        const alias = row.alias?.trim()
        const busy = busyId === row.id
        return (
          <li
            key={row.id}
            className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
                {row.avatar_url ? (
                  <img
                    src={row.avatar_url}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[16px] text-[#CC4B37]"
                    style={jost}
                  >
                    {initialFromUser(row.nombre, row.alias)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#111111]" style={lato}>
                  <span className="font-semibold">{name}</span>
                  {alias ? (
                    <span className="text-[#666666]"> · @{alias}</span>
                  ) : null}
                </p>
                {row.ciudad?.trim() ? (
                  <p
                    className="mt-0.5 text-[12px] text-[#666666]"
                    style={lato}
                  >
                    {row.ciudad.trim()}
                  </p>
                ) : null}
                {row.mensaje?.trim() ? (
                  <p
                    className="mt-2 text-[13px] italic text-[#666666]"
                    style={lato}
                  >
                    {row.mensaje.trim()}
                  </p>
                ) : null}
                <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                  {relativeTime(row.created_at)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleApprove(row)}
                style={jost}
                className="min-h-[40px] min-w-[120px] flex-1 bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-[#FFFFFF] transition-opacity disabled:opacity-50 sm:flex-none"
              >
                APROBAR
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleReject(row)}
                style={jost}
                className="min-h-[40px] min-w-[120px] flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2 text-[11px] font-extrabold uppercase text-[#666666] transition-opacity disabled:opacity-50 sm:flex-none"
              >
                RECHAZAR
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function IntegrantesTab({
  teamId,
  members,
  setMembers,
  viewerUserId,
  viewerIsFounder,
  viewerIsAdmin,
}: {
  teamId: string
  members: TeamMemberAdminRow[]
  setMembers: React.Dispatch<React.SetStateAction<TeamMemberAdminRow[]>>
  viewerUserId: string
  viewerIsFounder: boolean
  viewerIsAdmin: boolean
}) {
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const canShowRango = (m: TeamMemberAdminRow) => {
    if (m.user_id === viewerUserId) return false
    if (isFounderRol(m.rol_plataforma)) return false
    if (viewerIsFounder) return true
    if (viewerIsAdmin) {
      return (m.rol_plataforma || '').toLowerCase() === 'member'
    }
    return false
  }

  const canShowRolToggle = (m: TeamMemberAdminRow) => {
    if (!viewerIsFounder) return false
    if (m.user_id === viewerUserId) return false
    if (isFounderRol(m.rol_plataforma)) return false
    return true
  }

  const canShowRemove = (m: TeamMemberAdminRow) => {
    if (m.user_id === viewerUserId) return false
    if (isFounderRol(m.rol_plataforma)) return false
    if (viewerIsFounder) return true
    if (viewerIsAdmin) {
      return (m.rol_plataforma || '').toLowerCase() === 'member'
    }
    return false
  }

  const updateRango = async (memberId: string, nuevo: string) => {
    setBusyMemberId(memberId)
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ rango_militar: nuevo })
        .eq('id', memberId)
        .eq('team_id', teamId)

      if (error) throw error

      setMembers((prev) =>
        prev.map((x) =>
          x.id === memberId ? { ...x, rango_militar: nuevo } : x
        )
      )
    } catch {
      /* noop */
    } finally {
      setBusyMemberId(null)
    }
  }

  const toggleRol = async (memberId: string, next: 'admin' | 'member') => {
    setBusyMemberId(memberId)
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ rol_plataforma: next })
        .eq('id', memberId)
        .eq('team_id', teamId)

      if (error) throw error

      setMembers((prev) => {
        const nextList = prev.map((x) =>
          x.id === memberId ? { ...x, rol_plataforma: next } : x
        )
        return [...nextList].sort((a, b) => {
          const rank = (r: string | null) => {
            const x = (r || '').toLowerCase()
            if (x === 'founder') return 1
            if (x === 'admin') return 2
            return 3
          }
          const dr = rank(a.rol_plataforma) - rank(b.rol_plataforma)
          if (dr !== 0) return dr
          const an = (a.nombre || a.alias || '').toLowerCase()
          const bn = (b.nombre || b.alias || '').toLowerCase()
          return an.localeCompare(bn, 'es')
        })
      })
    } catch {
      /* noop */
    } finally {
      setBusyMemberId(null)
    }
  }

  const removeMember = async (memberId: string) => {
    setBusyMemberId(memberId)
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactivo' })
        .eq('id', memberId)
        .eq('team_id', teamId)

      if (error) throw error

      setMembers((prev) => prev.filter((x) => x.id !== memberId))
      setConfirmRemoveId(null)
    } catch {
      /* noop */
    } finally {
      setBusyMemberId(null)
    }
  }

  return (
    <ul className="flex flex-col gap-4 pb-10">
      {members.map((m) => {
        const name = m.nombre?.trim() || m.alias?.trim() || 'Usuario'
        const alias = m.alias?.trim()
        const busy = busyMemberId === m.id
        const showRango = canShowRango(m)
        const showRol = canShowRolToggle(m)
        const showRemove = canShowRemove(m)

        return (
          <li
            key={m.id}
            className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[16px] text-[#CC4B37]"
                    style={jost}
                  >
                    {initialFromUser(m.nombre, m.alias)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#111111]" style={lato}>
                  <span className="font-semibold">{name}</span>
                  {alias ? (
                    <span className="text-[#666666]"> · @{alias}</span>
                  ) : null}
                </p>
                {m.ciudad?.trim() ? (
                  <p
                    className="mt-0.5 text-[12px] text-[#666666]"
                    style={lato}
                  >
                    {m.ciudad.trim()}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    style={jost}
                    className="inline-block bg-[#F4F4F4] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#111111]"
                  >
                    {rolBadgeLabel(m.rol_plataforma)}
                  </span>
                  {m.rango_militar ? (
                    <span
                      style={lato}
                      className="text-[11px] font-normal uppercase text-[#666666]"
                    >
                      {formatRangoBadge(m.rango_militar)}
                    </span>
                  ) : null}
                </div>

                {showRango ? (
                  <div className="mt-3">
                    <label className="sr-only">Cambiar rango militar</label>
                    <select
                      disabled={busy}
                      value={(() => {
                        const r = (m.rango_militar || 'miembro').trim()
                        return RANGO_OPTIONS.some((o) => o === r)
                          ? r
                          : 'miembro'
                      })()}
                      onChange={(e) =>
                        void updateRango(m.id, e.target.value)
                      }
                      style={lato}
                      className="max-w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] py-2 pl-2 pr-8 text-[13px] text-[#111111]"
                    >
                      {RANGO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {showRol ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span style={jost} className="text-[10px] text-[#666666]">
                      Rol:
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleRol(m.id, 'admin')}
                        style={jost}
                        className={`min-h-[32px] px-3 text-[10px] font-extrabold uppercase ${
                          (m.rol_plataforma || '').toLowerCase() === 'admin'
                            ? 'bg-[#CC4B37] text-[#FFFFFF]'
                            : 'border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
                        }`}
                      >
                        ADMIN
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleRol(m.id, 'member')}
                        style={jost}
                        className={`min-h-[32px] px-3 text-[10px] font-extrabold uppercase ${
                          (m.rol_plataforma || '').toLowerCase() === 'member'
                            ? 'bg-[#CC4B37] text-[#FFFFFF]'
                            : 'border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
                        }`}
                      >
                        MIEMBRO
                      </button>
                    </div>
                  </div>
                ) : null}

                {showRemove ? (
                  <div className="mt-3">
                    {confirmRemoveId === m.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          style={lato}
                          className="text-[13px] text-[#111111]"
                        >
                          ¿Remover a @{alias || name}?
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeMember(m.id)}
                          style={jost}
                          className="min-h-[32px] bg-[#CC4B37] px-3 text-[10px] font-extrabold uppercase text-[#FFFFFF] disabled:opacity-50"
                        >
                          SÍ
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmRemoveId(null)}
                          style={jost}
                          className="min-h-[32px] border border-solid border-[#EEEEEE] px-3 text-[10px] font-extrabold uppercase text-[#666666] disabled:opacity-50"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmRemoveId(m.id)}
                        className="inline-flex items-center gap-1 text-[#999999] transition-colors hover:text-[#666666]"
                        aria-label="Remover integrante"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span style={jost} className="text-[10px] font-extrabold uppercase">
                          Remover
                        </span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function PerfilEquipoTab({
  slug,
  teamNombre,
  teamCiudad,
  logoUrl,
}: {
  slug: string
  teamNombre: string
  teamCiudad: string | null
  logoUrl: string | null
}) {
  const publicHref = `/equipos/${encodeURIComponent(slug)}`

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-4 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden bg-[#F4F4F4]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[18px] text-[#CC4B37]"
              style={jost}
            >
              {(teamNombre[0] || '?').toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p
            style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
            className="truncate text-[16px] text-[#111111]"
          >
            {teamNombre}
          </p>
          {teamCiudad?.trim() ? (
            <p className="mt-1 text-[13px] text-[#666666]" style={lato}>
              {teamCiudad.trim()}
            </p>
          ) : null}
        </div>
      </div>

      <Link
        href={`/equipos/${encodeURIComponent(slug)}/editar`}
        style={jost}
        className="flex h-12 w-full items-center justify-center bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
      >
        EDITAR PERFIL DEL EQUIPO
      </Link>

      <a
        href={publicHref}
        target="_blank"
        rel="noopener noreferrer"
        style={jost}
        className="flex h-12 w-full items-center justify-center border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
      >
        VER PERFIL PÚBLICO
      </a>
    </div>
  )
}
