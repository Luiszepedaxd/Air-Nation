'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Player = { id: string; name: string; team_name: string | null }
type Referee = { id: string; code: string; name: string | null; status: string; user_id: string | null }
type Round = { id: string; round_number: number; name: string | null; duration_seconds: number; status: string; started_at: string | null; ended_at: string | null; game_type?: string | null; foul_penalty_seconds?: number | null }

type TournamentDetail = {
  id: string
  name: string
  game_type: string
  status: string
  created_at: string
  public_results?: boolean
  public_slug?: string | null
  finalized_at?: string | null
  users?: { nombre?: string; alias?: string; email?: string } | null
  rounds: Round[]
  players: Player[]
  referees: Referee[]
}

type ScoreEntry = {
  player_id: string; name: string; team_name: string | null
  kills: number; deaths: number; first_kills: number; objectives: number
  key_actions: number; critical_actions: number
  performance_score: number; impact_score: number; total_score: number
  fouls: number
  drill_completes: number
}

export function AdminTorneoDetail({ tournamentId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRound, setSelectedRound] = useState<string | null>(null)
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([])
  const [scoreRoundGameType, setScoreRoundGameType] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch(`/tournaments/admin/${tournamentId}`)
      if (res.ok) setTournament(await res.json())
    } catch { /* silenciar */ }
    finally { setLoading(false) }
  }, [tournamentId])

  useEffect(() => { void load() }, [load])

  const loadScoreboard = useCallback(async (roundId: string) => {
    try {
      const res = await apiFetch(`/tournaments/${tournamentId}/rounds/${roundId}/scoreboard`)
      if (res.ok) {
        const data = await res.json()
        setScoreboard(data.scoreboard || [])
        setScoreRoundGameType(data.round?.game_type || null)
      }
    } catch { /* silenciar */ }
  }, [tournamentId])

  const handleExport = async () => {
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      const token = session?.access_token
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await fetch(`${API_BASE}/api/v1/tournaments/admin/${tournamentId}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Error')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tournament?.name || 'torneo'}_scoreboard.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch { /* silenciar */ }
  }

  const handleTogglePublish = async () => {
    if (!tournament) return
    try {
      const res = await apiFetch(`/tournaments/${tournament.id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ publish: !tournament.public_results }),
      })
      if (res.ok) void load()
    } catch { /* silenciar */ }
  }

  if (loading) {
    return <div className="h-64 animate-pulse bg-[#F4F4F4]" />
  }

  if (!tournament) {
    return (
      <div>
        <p className="text-[14px] text-[#CC4B37]" style={lato}>Torneo no encontrado.</p>
        <Link href="/admin/torneos" className="mt-2 inline-block text-[13px] text-[#666666] underline" style={lato}>← Volver</Link>
      </div>
    )
  }

  const creatorUser = Array.isArray(tournament.users) ? tournament.users[0] : tournament.users
  const creator = creatorUser?.nombre || creatorUser?.alias || creatorUser?.email || '—'

  return (
    <div style={lato}>
      <Link href="/admin/torneos" className="text-[11px] uppercase tracking-[0.12em] text-[#999999] hover:text-[#CC4B37]" style={jost}>
        ← TORNEOS
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] text-[#111111]" style={{ ...jost, textTransform: 'none' }}>
            {tournament.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span style={jost} className="inline-block border border-[#EEEEEE] px-2 py-0.5 text-[10px] text-[#444444]">
              {tournament.game_type === 'speedsoft' ? 'SPEEDSOFT' : 'TACTICAL ARENA'}
            </span>
            <span style={jost} className={`inline-block px-2 py-0.5 text-[10px] ${
              tournament.status === 'active' ? 'bg-[#2E7D32] text-[#FFFFFF]'
              : tournament.status === 'completed' ? 'bg-[#111111] text-[#FFFFFF]'
              : 'bg-[#F4F4F4] text-[#666666]'
            }`}>
              {tournament.status.toUpperCase()}
            </span>
            <span className="text-[11px] text-[#999999]">Creador: {creator}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#999999]">
            {tournament.players.length} jugadores · {tournament.referees.length} árbitros · {tournament.rounds.length} rondas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleExport()}
            style={jost}
            className="inline-flex bg-[#111111] px-4 py-2.5 text-[10px] tracking-[0.12em] text-[#FFFFFF] hover:bg-[#CC4B37]"
          >
            📥 DESCARGAR EXCEL
          </button>
          {tournament.public_results && (
            <button
              type="button"
              onClick={() => void handleTogglePublish()}
              style={jost}
              className="inline-flex border border-[#CC4B37] px-4 py-2.5 text-[10px] tracking-[0.12em] text-[#CC4B37] hover:bg-[#CC4B37] hover:text-[#FFFFFF]"
            >
              DESPUBLICAR
            </button>
          )}
        </div>
      </div>

      {/* Jugadores */}
      <section className="mt-8 border-t border-[#EEEEEE] pt-6">
        <h2 style={jost} className="mb-3 text-[11px] tracking-[0.12em] text-[#999999]">
          JUGADORES ({tournament.players.length})
        </h2>
        {tournament.players.length === 0 ? (
          <p className="text-[13px] text-[#666666]">Sin jugadores</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tournament.players.map(p => (
              <span key={p.id} className="border border-[#EEEEEE] px-3 py-1.5 text-[12px] text-[#111111]">
                {p.name}{p.team_name ? ` — ${p.team_name}` : ''}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Árbitros */}
      <section className="mt-6 border-t border-[#EEEEEE] pt-6">
        <h2 style={jost} className="mb-3 text-[11px] tracking-[0.12em] text-[#999999]">
          ÁRBITROS ({tournament.referees.length})
        </h2>
        {tournament.referees.length === 0 ? (
          <p className="text-[13px] text-[#666666]">Sin árbitros</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tournament.referees.map(r => (
              <span key={r.id} className={`border px-3 py-1.5 text-[12px] ${
                r.status === 'active' ? 'border-[#2E7D32] text-[#2E7D32]' : 'border-[#EEEEEE] text-[#999999]'
              }`}>
                <span className="font-mono font-bold">{r.code}</span>
                {r.name ? ` — ${r.name}` : ''}
                {r.status === 'active' ? ' ✓' : ''}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Scoreboard por ronda */}
      <section className="mt-6 border-t border-[#EEEEEE] pt-6">
        <h2 style={jost} className="mb-3 text-[11px] tracking-[0.12em] text-[#999999]">
          SCOREBOARD POR RONDA
        </h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {tournament.rounds.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedRound(r.id)
                void loadScoreboard(r.id)
              }}
              style={jost}
              className={`border px-4 py-2 text-[10px] tracking-[0.12em] transition-colors ${
                selectedRound === r.id
                  ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                  : 'border-[#EEEEEE] text-[#666666] hover:border-[#CC4B37]'
              }`}
            >
              {r.name || `Ronda ${r.round_number}`}
              <span className={`ml-2 inline-block px-1.5 py-0.5 text-[8px] ${
                r.status === 'active' ? 'bg-[#2E7D32] text-[#FFFFFF]'
                : r.status === 'completed' ? 'bg-[#111111] text-[#FFFFFF]'
                : 'bg-[#F4F4F4] text-[#999999]'
              }`}>
                {r.status === 'active' ? 'LIVE' : r.status === 'completed' ? 'DONE' : 'SETUP'}
              </span>
            </button>
          ))}
        </div>

        {selectedRound && scoreboard.length === 0 && (
          <p className="text-[13px] text-[#666666]">Sin datos para esta ronda</p>
        )}

        {scoreboard.length > 0 && (
          <div className="border border-[#EEEEEE]">
            {scoreRoundGameType === 'drills' ? (
              <>
                <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2">
                  <span style={jost} className="col-span-1 text-[9px] tracking-widest text-[#999999]">#</span>
                  <span style={jost} className="col-span-5 text-[9px] tracking-widest text-[#999999]">JUGADOR</span>
                  <span style={jost} className="col-span-2 text-center text-[9px] tracking-widest text-[#999999]">FOULS</span>
                  <span style={jost} className="col-span-2 text-center text-[9px] tracking-widest text-[#999999]">PENALIZ.</span>
                  <span style={jost} className="col-span-2 text-right text-[9px] tracking-widest text-[#CC4B37]">ESTADO</span>
                </div>
                {scoreboard.map((s, i) => (
                  <div key={s.player_id} className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-[#FAFAFA] ${i < scoreboard.length - 1 ? 'border-b border-[#F4F4F4]' : ''}`}>
                    <span className="col-span-1 text-[12px] font-bold text-[#999999]">{i + 1}</span>
                    <div className="col-span-5 min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#111111]">{s.name}</p>
                      {s.team_name && <p className="truncate text-[10px] text-[#999999]">{s.team_name}</p>}
                    </div>
                    <span className="col-span-2 text-center text-[13px] font-bold tabular-nums text-[#CC4B37]">{s.fouls || 0}</span>
                    <span className="col-span-2 text-center text-[13px] tabular-nums text-[#666666]">+{(s.fouls || 0) * (tournament.rounds.find(r => r.id === selectedRound)?.foul_penalty_seconds || 5)}s</span>
                    <span className="col-span-2 text-right text-[13px] font-bold tabular-nums text-[#2E7D32]">
                      {(s.drill_completes || 0) > 0 ? '✓ COMPLETADO' : 'PENDIENTE'}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2">
                  <span style={jost} className="col-span-1 text-[9px] tracking-widest text-[#999999]">#</span>
                  <span style={jost} className="col-span-3 text-[9px] tracking-widest text-[#999999]">JUGADOR</span>
                  <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">K</span>
                  <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">D</span>
                  <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">OBJ</span>
                  <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">KA</span>
                  <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">CA</span>
                  <span style={jost} className="col-span-2 text-right text-[9px] tracking-widest text-[#CC4B37]">TOTAL</span>
                </div>
                {scoreboard.map((s, i) => {
                  const hasFK = s.first_kills > 0
                  return (
                    <div key={s.player_id} className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-[#FAFAFA] ${i < scoreboard.length - 1 ? 'border-b border-[#F4F4F4]' : ''}`}>
                      <span className="col-span-1 text-[12px] font-bold text-[#999999]">{i + 1}</span>
                      <div className="col-span-3 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[13px] font-semibold text-[#111111]">{s.name}</p>
                          {hasFK && (
                            <span className="shrink-0 bg-[#CC4B37] px-1 py-0.5 text-[7px] font-bold uppercase tracking-wider text-[#FFFFFF]" style={jost}>
                              FK
                            </span>
                          )}
                        </div>
                        {s.team_name && <p className="truncate text-[10px] text-[#999999]">{s.team_name}</p>}
                      </div>
                      <span className="col-span-1 text-center text-[13px] font-bold tabular-nums text-[#111111]">{s.kills}</span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#666666]">{s.deaths}</span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]">{s.objectives}</span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]">{s.key_actions}</span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]">{s.critical_actions}</span>
                      <span className="col-span-2 text-right text-[15px] font-bold tabular-nums text-[#CC4B37]">{s.total_score}</span>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
