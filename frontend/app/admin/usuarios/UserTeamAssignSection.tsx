'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  assignUserToTeamAction,
  getUserTeamMembershipsAction,
  removeUserFromTeamAction,
  searchTeamsAdminAction,
  type TeamSearchRow,
  type UserMembershipRow,
} from './team-assign-actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export function UserTeamAssignSection({ userId }: { userId: string }) {
  const [q, setQ] = useState('')
  const [teams, setTeams] = useState<TeamSearchRow[]>([])
  const [memberships, setMemberships] = useState<UserMembershipRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null)

  const loadMemberships = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await getUserTeamMembershipsAction(userId)
    setLoading(false)
    if ('error' in res && res.error) {
      setError(res.error)
      return
    }
    if ('memberships' in res) {
      setMemberships(res.memberships)
    }
  }, [userId])

  useEffect(() => {
    void loadMemberships()
  }, [loadMemberships])

  useEffect(() => {
    const t = q.trim()
    if (t.length < 2) {
      setTeams([])
      return
    }
    let cancelled = false
    setSearching(true)
    const id = window.setTimeout(async () => {
      const res = await searchTeamsAdminAction(t)
      if (cancelled) return
      setSearching(false)
      if ('error' in res && res.error) {
        setError(res.error)
        setTeams([])
        return
      }
      if ('teams' in res) {
        setError('')
        setTeams(res.teams)
      }
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [q])

  const handleAssign = async (teamId: string) => {
    setPendingTeamId(teamId)
    setError('')
    const res = await assignUserToTeamAction(userId, teamId)
    setPendingTeamId(null)
    if ('error' in res && res.error) {
      setError(res.error)
      return
    }
    setQ('')
    setTeams([])
    await loadMemberships()
  }

  const handleRemove = async (teamId: string) => {
    setPendingTeamId(teamId)
    setError('')
    const res = await removeUserFromTeamAction(userId, teamId)
    setPendingTeamId(null)
    if ('error' in res && res.error) {
      setError(res.error)
      return
    }
    await loadMemberships()
  }

  return (
    <div
      className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-4"
      style={latoBody}
    >
      <p
        className="mb-3 text-[11px] tracking-[0.12em] text-[#111111]"
        style={jostHeading}
      >
        Asignar a equipo
      </p>

      {loading ? (
        <p className="text-[13px] text-[#666666]">Cargando equipos…</p>
      ) : null}

      {memberships.length > 0 ? (
        <ul className="mb-4 flex flex-col gap-2">
          {memberships.map((m) => (
            <li
              key={m.teamId}
              className="flex flex-wrap items-center justify-between gap-2 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2"
            >
              <span className="text-[13px] text-[#111111]">
                <span className="font-semibold">{m.nombre}</span>
                {m.ciudad ? (
                  <span className="text-[#666666]"> · {m.ciudad}</span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={pendingTeamId === m.teamId}
                onClick={() => void handleRemove(m.teamId)}
                className="border border-solid border-[#CC4B37] px-2 py-1 text-[10px] text-[#CC4B37] transition-colors hover:bg-[#CC4B37] hover:text-white disabled:opacity-50"
                style={jostHeading}
              >
                QUITAR
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className="block text-[12px] text-[#666666]">
        Buscar equipo por nombre
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Mínimo 2 caracteres"
          className="mt-1 w-full max-w-md border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-sm text-[#111111]"
          style={{ ...latoBody, borderRadius: 2 }}
        />
      </label>
      {searching ? (
        <p className="mt-2 text-[12px] text-[#666666]">Buscando…</p>
      ) : null}

      {teams.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {teams.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2"
            >
              <span className="text-[13px] text-[#111111]">
                <span className="font-semibold">{t.nombre}</span>
                {t.ciudad ? (
                  <span className="text-[#666666]"> · {t.ciudad}</span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={pendingTeamId === t.id}
                onClick={() => void handleAssign(t.id)}
                className="bg-[#111111] px-3 py-1.5 text-[10px] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37] disabled:opacity-50"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                ASIGNAR
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-[#CC4B37]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
