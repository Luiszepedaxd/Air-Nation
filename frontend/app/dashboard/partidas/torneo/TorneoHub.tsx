'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiFetch'
import { DurationPicker } from '@/components/DurationPicker'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#DDDDDD] bg-[#FFFFFF] px-3 py-2.5 text-[13px] text-[#111111] outline-none transition-colors focus:border-[#CC4B37]'

const btnPrimary =
  'inline-flex min-h-[44px] items-center justify-center bg-[#111111] px-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37] disabled:opacity-50'

const btnSecondary =
  'inline-flex min-h-[44px] items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]'

type Tournament = {
  id: string
  name: string
  game_type: 'speedsoft' | 'tactical_arena' | 'drills' | null
  status: 'setup' | 'active' | 'completed' | 'finalized'
  default_round_duration_seconds: number
  created_at: string
}

type RefereeTournament = {
  id: string
  tournament_id: string
  code: string
  status: string
  tournaments: Tournament
}

function gameTypeLabel(type: Tournament['game_type']) {
  if (type === 'speedsoft') return 'SPEEDSOFT'
  if (type === 'tactical_arena') return 'TACTICAL ARENA'
  if (type === 'drills') return 'DRILLS'
  return 'MIXTO'
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'active') return 'bg-[#2E7D32] text-[#FFFFFF]'
  if (s === 'completed') return 'bg-[#111111] text-[#FFFFFF]'
  return 'bg-[#F4F4F4] text-[#666666]'
}

function statusLabel(status: string) {
  const s = status.toLowerCase()
  if (s === 'active') return 'EN VIVO'
  if (s === 'completed') return 'TERMINADO'
  return 'SETUP'
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}min`
  return `${m} min`
}

export function TorneoHub() {
  const router = useRouter()
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu')
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([])
  const [refTournaments, setRefTournaments] = useState<RefereeTournament[]>([])
  const [loading, setLoading] = useState(true)

  const [tName, setTName] = useState('')
  const [tType, setTType] = useState<'speedsoft' | 'tactical_arena' | 'drills'>('speedsoft')
  const [tDuration, setTDuration] = useState(180)
  const [creating, setCreating] = useState(false)

  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinResult, setJoinResult] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [mineRes, refRes] = await Promise.all([
        apiFetch('/tournaments/mine'),
        apiFetch('/tournaments/referee/mine'),
      ])
      if (mineRes.ok) setMyTournaments(await mineRes.json())
      if (refRes.ok) setRefTournaments(await refRes.json())
    } catch {
      // silenciar
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCreate = async () => {
    if (!tName.trim()) return
    if (tDuration < 60) {
      setError('La duración mínima es 1 minuto')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const res = await apiFetch('/tournaments', {
        method: 'POST',
        body: JSON.stringify({
          name: tName.trim(),
          game_type: tType,
          default_round_duration_seconds: tDuration,
        }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Error al crear')
      }
      const data = await res.json()
      router.push(`/dashboard/torneos/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    setError(null)
    setJoinResult(null)
    try {
      const res = await apiFetch('/tournaments/join', {
        method: 'POST',
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Código inválido')
      setJoinResult(`Te uniste al torneo: ${data.tournaments?.name || 'OK'}`)
      setJoinCode('')
      void loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setJoining(false)
    }
  }

  const handleDeleteTournament = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      return
    }
    try {
      const res = await apiFetch(`/tournaments/${id}`, { method: 'DELETE' })
      if (res.ok) void loadData()
    } catch {
      /* silenciar */
    }
  }

  return (
    <div className="mx-auto max-w-[640px] p-4 pb-16 md:p-6">
      <Link
        href="/dashboard/perfil?tab=partidas"
        className="text-[11px] uppercase tracking-[0.12em] text-[#999999] transition-colors hover:text-[#CC4B37]"
        style={jost}
      >
        ← PARTIDAS
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-[36px]" role="img" aria-label="Trofeo">
          🏆
        </span>
        <div>
          <h1
            style={{ ...jost, textTransform: 'none' }}
            className="text-[24px] text-[#111111]"
          >
            Torneo
          </h1>
          <p className="text-[13px] text-[#666666]" style={lato}>
            Arbitraje en tiempo real
          </p>
        </div>
      </div>

      {mode === 'menu' && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setMode('create')
              setError(null)
              setJoinResult(null)
            }}
            style={jost}
            className={`${btnPrimary} flex-1`}
          >
            CREAR TORNEO
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join')
              setError(null)
              setJoinResult(null)
            }}
            style={jost}
            className={`${btnSecondary} flex-1`}
          >
            UNIRSE COMO ÁRBITRO
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="mt-6 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-5">
          <p style={jost} className="mb-5 text-[13px] font-extrabold uppercase text-[#111111]">
            NUEVO TORNEO
          </p>
          <div className="space-y-4">
            <div>
              <label
                className="mb-1 block text-[11px] uppercase tracking-wide text-[#999999]"
                style={jost}
              >
                Nombre
              </label>
              <input
                type="text"
                value={tName}
                onChange={(e) => setTName(e.target.value)}
                placeholder="Nombre del torneo"
                className={inputClass}
                style={lato}
                maxLength={100}
                autoFocus
              />
            </div>
            <div>
              <label
                className="mb-1 block text-[11px] uppercase tracking-wide text-[#999999]"
                style={jost}
              >
                Modo principal (opcional)
              </label>
              <select
                value={tType}
                onChange={(e) =>
                  setTType(e.target.value as 'speedsoft' | 'tactical_arena' | 'drills')
                }
                className={inputClass}
                style={lato}
              >
                <option value="speedsoft">Speedsoft</option>
                <option value="tactical_arena">Tactical Arena</option>
                <option value="drills">Drills Individuales</option>
              </select>
            </div>
            <DurationPicker
              value={tDuration}
              onChange={setTDuration}
              showHours
              label="DURACIÓN POR RONDA (DEFAULT)"
            />
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating || !tName.trim() || tDuration < 60}
              style={jost}
              className={`${btnPrimary} flex-1`}
            >
              {creating ? 'CREANDO…' : 'CREAR'}
            </button>
            <button
              type="button"
              onClick={() => setMode('menu')}
              style={jost}
              className={`${btnSecondary} flex-1`}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="mt-6 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-5">
          <p style={jost} className="mb-5 text-[13px] font-extrabold uppercase text-[#111111]">
            UNIRSE COMO ÁRBITRO
          </p>
          <label
            className="mb-1 block text-[11px] uppercase tracking-wide text-[#999999]"
            style={jost}
          >
            Código de acceso
          </label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) =>
              setJoinCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 6)
              )
            }
            placeholder="ABC123"
            className={`${inputClass} text-center text-[18px] uppercase tracking-[0.3em]`}
            style={lato}
            maxLength={6}
            autoFocus
          />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleJoin()}
              disabled={joining || joinCode.trim().length < 6}
              style={jost}
              className={`${btnPrimary} flex-1`}
            >
              {joining ? 'UNIENDO…' : 'UNIRSE'}
            </button>
            <button
              type="button"
              onClick={() => setMode('menu')}
              style={jost}
              className={`${btnSecondary} flex-1`}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-[13px] text-[#CC4B37]" style={lato}>
          {error}
        </p>
      )}
      {joinResult && (
        <p className="mt-3 text-[13px] font-semibold text-[#2E7D32]" style={lato}>
          {joinResult}
        </p>
      )}

      <section className="mt-8 border-t border-[#EEEEEE] pt-6">
        <h2
          style={{ ...jost, fontSize: 11, letterSpacing: '0.12em' }}
          className="mb-4 text-[#999999]"
        >
          MIS TORNEOS
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((k) => (
              <div
                key={k}
                className="h-20 animate-pulse border border-[#EEEEEE] bg-[#F4F4F4]"
              />
            ))}
          </div>
        ) : myTournaments.length === 0 ? (
          <p className="text-[13px] text-[#666666]" style={lato}>
            Aún no has creado torneos
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {myTournaments.map((t) => (
              <li
                key={t.id}
                className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4 transition-colors hover:border-[#DDDDDD]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[14px] text-[#111111]"
                      style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
                    >
                      {t.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        style={jost}
                        className="inline-block border border-[#EEEEEE] px-2 py-0.5 text-[10px] tracking-wide text-[#444444]"
                      >
                        {gameTypeLabel(t.game_type)}
                      </span>
                      <span
                        style={jost}
                        className={`inline-block px-2 py-0.5 text-[10px] tracking-wide ${statusBadgeClass(t.status)}`}
                      >
                        {statusLabel(t.status)}
                      </span>
                      <span className="text-[11px] text-[#999999]" style={lato}>
                        {formatDuration(t.default_round_duration_seconds)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#999999]" style={lato}>
                      {formatDate(t.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/torneos/${t.id}`)}
                      style={jost}
                      className={`${btnPrimary} shrink-0 px-4 py-2 text-[10px]`}
                    >
                      ADMINISTRAR
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTournament(t.id, t.name)}
                      style={lato}
                      className="shrink-0 px-2 py-2 text-[12px] text-[#CC4B37] transition-colors hover:text-[#111111]"
                      title="Eliminar torneo"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 border-t border-[#EEEEEE] pt-6">
        <h2
          style={{ ...jost, fontSize: 11, letterSpacing: '0.12em' }}
          className="mb-4 text-[#999999]"
        >
          COMO ÁRBITRO
        </h2>
        {loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse border border-[#EEEEEE] bg-[#F4F4F4]" />
          </div>
        ) : refTournaments.length === 0 ? (
          <p className="text-[13px] text-[#666666]" style={lato}>
            No estás asignado como árbitro en ningún torneo
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {refTournaments.map((r) => {
              const t = r.tournaments
              if (!t) return null
              return (
                <li
                  key={r.id}
                  className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4 transition-colors hover:border-[#DDDDDD]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[14px] text-[#111111]"
                        style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
                      >
                        {t.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          style={jost}
                          className={`inline-block px-2 py-0.5 text-[10px] tracking-wide ${statusBadgeClass(t.status)}`}
                        >
                          {statusLabel(t.status)}
                        </span>
                        <span className="font-mono text-[11px] text-[#999999]" style={lato}>
                          Código: {r.code}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/torneos/${t.id}`)}
                      style={jost}
                      className={`${btnPrimary} shrink-0 px-4 py-2 text-[10px]`}
                    >
                      ENTRAR
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
