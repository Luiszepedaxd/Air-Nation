'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type Tournament = {
  id: string
  name: string
  game_type: 'speedsoft' | 'tactical_arena'
  status: 'setup' | 'active' | 'completed'
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

function TrophyIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M14 6h20v4a8 8 0 01-8 8 8 8 0 01-8-8V6z"
        stroke="#CC4B37"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 8h4v2a6 6 0 006 6v0a6 6 0 006-6V8h4"
        stroke="#111111"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M24 22v8" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 38h16l-2-6H18l-2 6z"
        stroke="#111111"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 38h24"
        stroke="#CC4B37"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function gameTypeLabel(type: Tournament['game_type']) {
  return type === 'speedsoft' ? 'SPEEDSOFT' : 'TACTICAL ARENA'
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'active') return 'bg-[#2E7D32] text-[#FFFFFF]'
  if (s === 'completed') return 'bg-[#111111] text-[#FFFFFF]'
  return 'bg-[#F4F4F4] text-[#666666]'
}

function statusLabel(status: string) {
  const s = status.toLowerCase()
  if (s === 'active') return 'ACTIVE'
  if (s === 'completed') return 'COMPLETED'
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

const inputClass =
  'w-full border border-solid border-[#DDDDDD] bg-[#FFFFFF] px-3 py-2.5 text-[13px] text-[#111111] outline-none transition-colors focus:border-[#CC4B37]'

const btnPrimary =
  'inline-flex min-h-[44px] items-center justify-center bg-[#111111] px-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37] disabled:opacity-50'

const btnSecondary =
  'inline-flex min-h-[44px] items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]'

export function PartidasTab() {
  const [torneoOpen, setTorneoOpen] = useState(false)
  const [mode, setMode] = useState<'cards' | 'create' | 'join'>('cards')
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([])
  const [refTournaments, setRefTournaments] = useState<RefereeTournament[]>([])
  const [loading, setLoading] = useState(true)

  const [tName, setTName] = useState('')
  const [tType, setTType] = useState<'speedsoft' | 'tactical_arena'>('speedsoft')
  const [tDuration, setTDuration] = useState(180)
  const [creating, setCreating] = useState(false)

  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinResult, setJoinResult] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

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
      setTName('')
      setMode('cards')
      setTorneoOpen(false)
      void loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
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
      setMode('cards')
      setTorneoOpen(false)
      void loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="mx-auto max-w-[640px] pb-10">
      <h1 style={jost} className="text-[22px] font-extrabold uppercase text-[#111111]">
        PARTIDAS
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#666666]" style={lato}>
        Crea torneos o únete como árbitro para registrar partidas en tiempo real.
      </p>

      {/* Card TORNEO */}
      <button
        type="button"
        onClick={() => {
          setTorneoOpen((o) => !o)
          if (torneoOpen) {
            setMode('cards')
            setError(null)
            setJoinResult(null)
          }
        }}
        className="mt-6 flex w-full flex-col items-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-6 transition-colors hover:border-[#CC4B37]/40"
      >
        <TrophyIcon />
        <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#111111]">
          TORNEO
        </p>
        <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
          Arbitraje en tiempo real
        </p>
      </button>

      {/* Opciones CREAR / UNIRSE */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          torneoOpen && mode === 'cards' ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
      </div>

      {/* Formulario crear torneo */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          mode === 'create' ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mt-4 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
          <p style={jost} className="mb-4 text-[12px] font-extrabold uppercase text-[#111111]">
            NUEVO TORNEO
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-[#999999]" style={jost}>
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
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-[#999999]" style={jost}>
                Tipo de juego
              </label>
              <select
                value={tType}
                onChange={(e) =>
                  setTType(e.target.value as 'speedsoft' | 'tactical_arena')
                }
                className={inputClass}
                style={lato}
              >
                <option value="speedsoft">Speedsoft</option>
                <option value="tactical_arena">Tactical Arena</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-[#999999]" style={jost}>
                Duración por ronda (segundos)
              </label>
              <input
                type="number"
                value={tDuration}
                onChange={(e) => setTDuration(Number(e.target.value) || 180)}
                min={30}
                max={3600}
                className={inputClass}
                style={lato}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating || !tName.trim()}
              style={jost}
              className={`${btnPrimary} flex-1`}
            >
              {creating ? 'CREANDO…' : 'CREAR'}
            </button>
            <button
              type="button"
              onClick={() => setMode('cards')}
              style={jost}
              className={`${btnSecondary} flex-1`}
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>

      {/* Formulario unirse como árbitro */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          mode === 'join' ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mt-4 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
          <p style={jost} className="mb-4 text-[12px] font-extrabold uppercase text-[#111111]">
            UNIRSE COMO ÁRBITRO
          </p>
          <label className="mb-1 block text-[11px] uppercase tracking-wide text-[#999999]" style={jost}>
            Código de 6 caracteres
          </label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            className={`${inputClass} uppercase tracking-[0.2em]`}
            style={lato}
            maxLength={6}
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
              onClick={() => setMode('cards')}
              style={jost}
              className={`${btnSecondary} flex-1`}
            >
              CANCELAR
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-[13px] text-[#CC4B37]" style={lato}>{error}</p>
      )}
      {joinResult && (
        <p className="mt-3 text-[13px] font-semibold text-[#2E7D32]" style={lato}>
          {joinResult}
        </p>
      )}

      {/* MIS TORNEOS */}
      <section className="mt-8 border-t border-[#EEEEEE] pt-6">
        <h2 style={{ ...jost, fontSize: 10, color: '#999999' }} className="mb-4">
          MIS TORNEOS
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((k) => (
              <div key={k} className="h-24 animate-pulse border border-[#EEEEEE] bg-[#F4F4F4]" />
            ))}
          </div>
        ) : myTournaments.length === 0 ? (
          <p className="text-[13px] text-[#666666]" style={lato}>
            Aún no has creado torneos
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {myTournaments.map((t) => (
              <li
                key={t.id}
                className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4 transition-colors hover:border-[#DDDDDD]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="truncate text-[14px] text-[#111111]"
                      style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
                    >
                      {t.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        style={jost}
                        className="inline-block border border-[#EEEEEE] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#444444]"
                      >
                        {gameTypeLabel(t.game_type)}
                      </span>
                      <span
                        style={jost}
                        className={`inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${statusBadgeClass(t.status)}`}
                      >
                        {statusLabel(t.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#999999]" style={lato}>
                      {formatDate(t.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/torneos/${t.id}`)}
                    style={jost}
                    className={`${btnPrimary} shrink-0 px-4 py-2 text-[10px]`}
                  >
                    ADMINISTRAR
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* COMO ÁRBITRO */}
      <section className="mt-8 border-t border-[#EEEEEE] pt-6">
        <h2 style={{ ...jost, fontSize: 10, color: '#999999' }} className="mb-4">
          COMO ÁRBITRO
        </h2>
        {loading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse border border-[#EEEEEE] bg-[#F4F4F4]" />
          </div>
        ) : refTournaments.length === 0 ? (
          <p className="text-[13px] text-[#666666]" style={lato}>
            No estás asignado como árbitro en ningún torneo
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {refTournaments.map((r) => {
              const t = r.tournaments
              if (!t) return null
              return (
                <li
                  key={r.id}
                  className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4 transition-colors hover:border-[#DDDDDD]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="truncate text-[14px] text-[#111111]"
                        style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
                      >
                        {t.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          style={jost}
                          className={`inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${statusBadgeClass(t.status)}`}
                        >
                          {statusLabel(t.status)}
                        </span>
                        <span className="text-[11px] text-[#999999]" style={lato}>
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
