'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'
import { DurationPicker } from '@/components/DurationPicker'

type Tournament = {
  id: string
  name: string
  game_type: 'speedsoft' | 'tactical_arena'
  status: string
  default_round_duration_seconds: number
  created_by: string
  created_at: string
  is_creator: boolean
  rounds: Round[]
  players: Player[]
  referees: Referee[]
}

type Player = {
  id: string
  tournament_id: string
  name: string
  team_name: string | null
  created_at: string
}

type Referee = {
  id: string
  tournament_id: string
  code: string
  name: string | null
  user_id: string | null
  status: 'pending' | 'active'
  joined_at: string | null
  created_at: string
}

type Round = {
  id: string
  tournament_id: string
  round_number: number
  name: string | null
  duration_seconds: number
  status: 'setup' | 'active' | 'completed'
  started_at: string | null
  ended_at: string | null
  created_at: string
}

type Assignment = {
  id: string
  round_id: string
  referee_id: string
  player_id: string
  tournament_referees: Referee
  tournament_players: Player
}

type ScoreboardEntry = {
  player_id: string
  name: string
  team_name: string | null
  kills: number
  deaths: number
  first_kills: number
  objectives: number
  key_actions: number
  critical_actions: number
  performance_score: number
  impact_score: number
  total_score: number
}

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#DDDDDD] bg-[#FFFFFF] px-3 py-2.5 text-[13px] text-[#111111] outline-none transition-colors focus:border-[#CC4B37]'

const btnPrimary =
  'inline-flex min-h-[40px] items-center justify-center bg-[#111111] px-5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37] disabled:opacity-50'

const btnDanger =
  'inline-flex min-h-[36px] items-center justify-center bg-[#CC4B37] px-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#111111] disabled:opacity-50'

type SubTab = 'setup' | 'rondas' | 'scoreboard'

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TournamentAdminClient({
  tournamentId,
  userId,
}: {
  tournamentId: string
  userId: string
}) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subTab, setSubTab] = useState<SubTab>('setup')

  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerTeam, setNewPlayerTeam] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)
  // String y no number para que el campo pueda quedar vacío mientras se escribe.
  const [refCount, setRefCount] = useState('1')
  const [generatingRefs, setGeneratingRefs] = useState(false)

  const [roundName, setRoundName] = useState('')
  const [roundDuration, setRoundDuration] = useState(0)
  const [creatingRound, setCreatingRound] = useState(false)
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedReferee, setSelectedReferee] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)

  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([])
  const [scoreRoundId, setScoreRoundId] = useState<string | null>(null)

  const router = useRouter()

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // La duración por defecto solo se copia al form la primera vez, para no
  // sobrescribir lo que el productor ya escribió en recargas posteriores.
  const durationSeededRef = useRef(false)

  const loadTournament = useCallback(async () => {
    try {
      const res = await apiFetch(`/tournaments/${tournamentId}`)
      if (!res.ok) throw new Error('No se pudo cargar el torneo')
      const data: Tournament = await res.json()
      setTournament(data)
      if (!durationSeededRef.current) {
        durationSeededRef.current = true
        // La rueda de rondas llega hasta 60 min, así que un default más largo
        // se recorta para que el valor mostrado sea el que se envía.
        setRoundDuration(Math.min(data.default_round_duration_seconds, 3600))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    void loadTournament()
  }, [loadTournament])

  const loadAssignments = useCallback(
    async (roundId: string) => {
      try {
        const res = await apiFetch(
          `/tournaments/${tournamentId}/rounds/${roundId}/assignments`
        )
        if (res.ok) setAssignments(await res.json())
      } catch {
        /* silenciar */
      }
    },
    [tournamentId]
  )

  const loadScoreboard = useCallback(
    async (roundId: string) => {
      try {
        const res = await apiFetch(
          `/tournaments/${tournamentId}/rounds/${roundId}/scoreboard`
        )
        if (res.ok) {
          const data = await res.json()
          setScoreboard(data.scoreboard || [])
        }
      } catch {
        /* silenciar */
      }
    },
    [tournamentId]
  )

  const startTimer = useCallback((round: Round) => {
    if (!round.started_at) return
    const startedMs = new Date(round.started_at).getTime()
    const endMs = startedMs + round.duration_seconds * 1000

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endMs - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0 && timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    tick()
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(tick, 1000)
  }, [])

  const rounds = tournament?.rounds

  useEffect(() => {
    if (!activeRoundId) return
    const activeRound = rounds?.find((r) => r.id === activeRoundId)
    if (activeRound?.status === 'active') {
      startTimer(activeRound)

      const poll = () => void loadScoreboard(activeRoundId)
      poll()
      pollRef.current = setInterval(poll, 3000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [activeRoundId, rounds, startTimer, loadScoreboard])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Los árbitros se unen desde otro dispositivo, así que SETUP se refresca solo
  // para que aparezcan como CONECTADO sin recargar la página.
  const isCreatorView = tournament?.is_creator ?? false

  useEffect(() => {
    if (!isCreatorView || subTab !== 'setup') return
    const interval = setInterval(() => void loadTournament(), 5000)
    return () => clearInterval(interval)
  }, [isCreatorView, subTab, loadTournament])

  // El árbitro no dispara ninguna acción aquí, así que necesita refrescar
  // para enterarse de que el productor ya inició una ronda.
  const isRefereeView = tournament ? !tournament.is_creator : false
  const refereeActiveRoundId = isRefereeView
    ? ((tournament?.rounds || []).find((r) => r.status === 'active')?.id ?? null)
    : null

  useEffect(() => {
    if (!isRefereeView || refereeActiveRoundId) return
    const poll = setInterval(() => void loadTournament(), 3000)
    return () => clearInterval(poll)
  }, [isRefereeView, refereeActiveRoundId, loadTournament])

  // En cuanto el productor inicia la ronda el árbitro entra directo al modo
  // muñeca, sin tener que tocar nada.
  useEffect(() => {
    if (!refereeActiveRoundId) return
    router.push(
      `/dashboard/torneos/${tournamentId}/arbitro?roundId=${refereeActiveRoundId}`
    )
  }, [refereeActiveRoundId, tournamentId, router])

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return
    setAddingPlayer(true)
    try {
      const res = await apiFetch(`/tournaments/${tournamentId}/players`, {
        method: 'POST',
        body: JSON.stringify({
          name: newPlayerName.trim(),
          team_name: newPlayerTeam.trim() || null,
        }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      setNewPlayerName('')
      setNewPlayerTeam('')
      void loadTournament()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setAddingPlayer(false)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await apiFetch(`/tournaments/${tournamentId}/players/${playerId}`, {
        method: 'DELETE',
      })
      void loadTournament()
    } catch {
      /* silenciar */
    }
  }

  const handleGenerateRefs = async () => {
    setGeneratingRefs(true)
    try {
      const res = await apiFetch(
        `/tournaments/${tournamentId}/referees/generate`,
        {
          method: 'POST',
          body: JSON.stringify({ count: parseInt(refCount, 10) || 1 }),
        }
      )
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      void loadTournament()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setGeneratingRefs(false)
    }
  }

  const handleCreateRound = async () => {
    setCreatingRound(true)
    try {
      const res = await apiFetch(`/tournaments/${tournamentId}/rounds`, {
        method: 'POST',
        body: JSON.stringify({
          name: roundName.trim() || null,
          duration_seconds: roundDuration || undefined,
        }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      setRoundName('')
      void loadTournament()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setCreatingRound(false)
    }
  }

  const handleSelectRound = (roundId: string) => {
    setActiveRoundId(roundId)
    setSelectedReferee(null)
    setSelectedPlayer(null)
    void loadAssignments(roundId)
  }

  const handleAssign = async () => {
    if (!activeRoundId || !selectedReferee || !selectedPlayer) return
    setAssigning(true)
    try {
      const res = await apiFetch(
        `/tournaments/${tournamentId}/rounds/${activeRoundId}/assign`,
        {
          method: 'POST',
          body: JSON.stringify({
            referee_id: selectedReferee,
            player_id: selectedPlayer,
          }),
        }
      )
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      setSelectedReferee(null)
      setSelectedPlayer(null)
      void loadAssignments(activeRoundId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async (assignmentId: string) => {
    if (!activeRoundId) return
    try {
      await apiFetch(
        `/tournaments/${tournamentId}/rounds/${activeRoundId}/assign/${assignmentId}`,
        { method: 'DELETE' }
      )
      void loadAssignments(activeRoundId)
    } catch {
      /* silenciar */
    }
  }

  const handleStartRound = async () => {
    if (!activeRoundId) return
    try {
      const res = await apiFetch(
        `/tournaments/${tournamentId}/rounds/${activeRoundId}/start`,
        { method: 'PATCH' }
      )
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      void loadTournament()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const handleEndRound = async () => {
    if (!activeRoundId) return
    try {
      const res = await apiFetch(
        `/tournaments/${tournamentId}/rounds/${activeRoundId}/end`,
        { method: 'PATCH' }
      )
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }
      setTimeLeft(null)
      void loadTournament()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const handleDeleteTournament = async () => {
    if (
      !window.confirm(
        `¿Eliminar "${tournament?.name}"? Se borrarán todos los datos. Esta acción no se puede deshacer.`
      )
    ) {
      return
    }
    try {
      const res = await apiFetch(`/tournaments/${tournamentId}`, {
        method: 'DELETE',
      })
      if (res.ok) router.push('/dashboard/perfil?tab=partidas')
    } catch {
      /* silenciar */
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[900px] p-6">
        <div className="h-8 w-48 animate-pulse bg-[#F4F4F4]" />
        <div className="mt-4 h-64 animate-pulse bg-[#F4F4F4]" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-[900px] p-6">
        <p className="text-[14px] text-[#CC4B37]" style={lato}>
          Torneo no encontrado o sin acceso.
        </p>
        <Link
          href="/dashboard/perfil"
          className="mt-2 inline-block text-[13px] text-[#666666] underline"
          style={lato}
        >
          ← Volver al perfil
        </Link>
      </div>
    )
  }

  const isCreator = tournament.is_creator
  const activeRound = tournament.rounds?.find((r) => r.id === activeRoundId)
  const myRefereeRecord = (tournament.referees || []).find(
    (r) => r.user_id === userId
  )
  const completedRoundsForReferee = (tournament.rounds || []).filter(
    (r) => r.status === 'completed'
  )

  const assignedRefIds = new Set(assignments.map((a) => a.referee_id))
  const assignedPlayerIds = new Set(assignments.map((a) => a.player_id))
  const availableRefs = (tournament.referees || []).filter(
    (r) => r.status === 'active' && !assignedRefIds.has(r.id)
  )
  const availablePlayers = (tournament.players || []).filter(
    (p) => !assignedPlayerIds.has(p.id)
  )

  return (
    <div className="mx-auto max-w-[900px] p-4 pb-16 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/perfil?tab=partidas"
          className="text-[11px] uppercase tracking-[0.12em] text-[#999999] transition-colors hover:text-[#CC4B37]"
          style={jost}
        >
          ← PARTIDAS
        </Link>
        <h1
          className="mt-2 text-[24px] text-[#111111] md:text-[28px]"
          style={{ ...jost, textTransform: 'none' }}
        >
          {tournament.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            style={jost}
            className="inline-block border border-[#EEEEEE] px-2 py-0.5 text-[10px] tracking-wide text-[#444444]"
          >
            {tournament.game_type === 'speedsoft' ? 'SPEEDSOFT' : 'TACTICAL ARENA'}
          </span>
          <span
            style={jost}
            className={`inline-block px-2 py-0.5 text-[10px] tracking-wide ${
              tournament.status === 'active'
                ? 'bg-[#2E7D32] text-[#FFFFFF]'
                : tournament.status === 'completed'
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'bg-[#F4F4F4] text-[#666666]'
            }`}
          >
            {tournament.status.toUpperCase()}
          </span>
          <span className="text-[11px] text-[#999999]" style={lato}>
            {tournament.players?.length || 0} jugadores ·{' '}
            {tournament.referees?.length || 0} árbitros ·{' '}
            {tournament.rounds?.length || 0} rondas
          </span>
        </div>
        {isCreator && (
          <button
            type="button"
            onClick={() => void handleDeleteTournament()}
            style={lato}
            className="mt-2 block text-[11px] text-[#CC4B37] transition-colors hover:text-[#111111]"
          >
            Eliminar torneo
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 border border-[#CC4B37]/30 bg-[#CC4B37]/5 px-4 py-3">
          <p className="text-[13px] text-[#CC4B37]" style={lato}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-1 text-[11px] text-[#CC4B37] underline"
            style={lato}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      {isCreator && (
        <div className="mb-6 flex gap-0 border-b border-[#EEEEEE]">
          {(['setup', 'rondas', 'scoreboard'] as SubTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              style={jost}
              className={`border-b-2 px-5 pb-3 pt-2 text-[11px] tracking-[0.12em] transition-colors ${
                subTab === tab
                  ? 'border-[#CC4B37] text-[#111111]'
                  : 'border-transparent text-[#888888] hover:text-[#444444]'
              }`}
            >
              {tab === 'setup' ? 'SETUP' : tab === 'rondas' ? 'RONDAS' : 'SCOREBOARD'}
            </button>
          ))}
        </div>
      )}

      {/* ═══════════════ TAB: SETUP ═══════════════ */}
      {subTab === 'setup' && isCreator && (
        <div className="space-y-8">
          <section>
            <h2
              style={{ ...jost, fontSize: 11, letterSpacing: '0.12em' }}
              className="mb-3 text-[#999999]"
            >
              JUGADORES ({tournament.players?.length || 0})
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nombre del jugador"
                className={`${inputClass} flex-1`}
                style={lato}
                maxLength={80}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleAddPlayer()
                }}
              />
              <input
                type="text"
                value={newPlayerTeam}
                onChange={(e) => setNewPlayerTeam(e.target.value)}
                placeholder="Equipo (opcional)"
                className={`${inputClass} sm:max-w-[180px]`}
                style={lato}
                maxLength={80}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleAddPlayer()
                }}
              />
              <button
                type="button"
                onClick={() => void handleAddPlayer()}
                disabled={addingPlayer || !newPlayerName.trim()}
                style={jost}
                className={`${btnPrimary} shrink-0`}
              >
                {addingPlayer ? '...' : 'AGREGAR'}
              </button>
            </div>
            {(tournament.players || []).length > 0 && (
              <div className="mt-3 border border-[#EEEEEE]">
                {tournament.players.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      i < tournament.players.length - 1
                        ? 'border-b border-[#F4F4F4]'
                        : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <span
                        className="text-[13px] font-semibold text-[#111111]"
                        style={lato}
                      >
                        {p.name}
                      </span>
                      {p.team_name && (
                        <span className="ml-2 text-[11px] text-[#999999]" style={lato}>
                          {p.team_name}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeletePlayer(p.id)}
                      className="ml-2 text-[11px] text-[#CC4B37] transition-colors hover:text-[#111111]"
                      style={lato}
                      title="Eliminar jugador"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2
              style={{ ...jost, fontSize: 11, letterSpacing: '0.12em' }}
              className="mb-3 text-[#999999]"
            >
              CÓDIGOS DE ÁRBITRO ({tournament.referees?.length || 0})
            </h2>
            <div className="flex items-end gap-2">
              <div>
                <label
                  className="mb-1 block text-[10px] uppercase tracking-wide text-[#999999]"
                  style={jost}
                >
                  Cantidad
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={refCount}
                  onChange={(e) =>
                    setRefCount(e.target.value.replace(/[^0-9]/g, ''))
                  }
                  onBlur={() => {
                    const n = parseInt(refCount, 10)
                    if (!n || n < 1) setRefCount('1')
                    else if (n > 50) setRefCount('50')
                  }}
                  placeholder="1"
                  className={`${inputClass} w-[80px]`}
                  style={lato}
                  maxLength={2}
                />
              </div>
              <button
                type="button"
                onClick={() => void handleGenerateRefs()}
                disabled={generatingRefs}
                style={jost}
                className={btnPrimary}
              >
                {generatingRefs ? '...' : 'GENERAR CÓDIGOS'}
              </button>
            </div>
            {(tournament.referees || []).length > 0 && (
              <div className="mt-3 border border-[#EEEEEE]">
                <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2">
                  <span
                    style={jost}
                    className="col-span-3 text-[9px] tracking-widest text-[#999999]"
                  >
                    CÓDIGO
                  </span>
                  <span
                    style={jost}
                    className="col-span-4 text-[9px] tracking-widest text-[#999999]"
                  >
                    NOMBRE
                  </span>
                  <span
                    style={jost}
                    className="col-span-3 text-[9px] tracking-widest text-[#999999]"
                  >
                    STATUS
                  </span>
                  <span
                    style={jost}
                    className="col-span-2 text-right text-[9px] tracking-widest text-[#999999]"
                  >
                    UNIDO
                  </span>
                </div>
                {tournament.referees.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-12 items-center border-b border-[#F4F4F4] px-4 py-2.5 last:border-0"
                  >
                    <span
                      className="col-span-3 font-mono text-[13px] font-bold tracking-widest text-[#111111]"
                      style={lato}
                    >
                      {r.code}
                    </span>
                    <span className="col-span-4 text-[12px] text-[#666666]" style={lato}>
                      {r.name || '—'}
                    </span>
                    <span className="col-span-3">
                      <span
                        style={jost}
                        className={`inline-block px-2 py-0.5 text-[9px] tracking-wide ${
                          r.status === 'active'
                            ? 'bg-[#2E7D32] text-[#FFFFFF]'
                            : 'bg-[#F4F4F4] text-[#999999]'
                        }`}
                      >
                        {r.status === 'active' ? 'CONECTADO' : 'PENDIENTE'}
                      </span>
                    </span>
                    <span
                      className="col-span-2 text-right text-[11px] text-[#999999]"
                      style={lato}
                    >
                      {r.joined_at ? '✓' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ═══════════════ TAB: RONDAS ═══════════════ */}
      {subTab === 'rondas' && isCreator && (
        <div className="space-y-8">
          <section>
            <h2
              style={{ ...jost, fontSize: 11, letterSpacing: '0.12em' }}
              className="mb-3 text-[#999999]"
            >
              CREAR RONDA
            </h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                placeholder="Nombre (ej: Cobras vs Vipers)"
                className={inputClass}
                style={lato}
                maxLength={100}
              />
              <DurationPicker
                value={roundDuration}
                onChange={setRoundDuration}
                showHours={false}
                maxMinutes={60}
                label="DURACIÓN"
              />
              <button
                type="button"
                onClick={() => void handleCreateRound()}
                disabled={creatingRound}
                style={jost}
                className={btnPrimary}
              >
                {creatingRound ? '...' : 'CREAR'}
              </button>
            </div>
          </section>

          <section>
            <h2
              style={{ ...jost, fontSize: 11, letterSpacing: '0.12em' }}
              className="mb-3 text-[#999999]"
            >
              RONDAS ({tournament.rounds?.length || 0})
            </h2>
            {(tournament.rounds || []).length === 0 ? (
              <p className="text-[13px] text-[#666666]" style={lato}>
                Aún no hay rondas
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {tournament.rounds.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRound(r.id)}
                    className={`flex items-center justify-between border px-4 py-3 text-left transition-colors ${
                      activeRoundId === r.id
                        ? 'border-[#CC4B37] bg-[#CC4B37]/5'
                        : 'border-[#EEEEEE] bg-[#FFFFFF] hover:border-[#DDDDDD]'
                    }`}
                  >
                    <div>
                      <span
                        className="text-[13px] font-semibold text-[#111111]"
                        style={lato}
                      >
                        {r.name || `Ronda ${r.round_number}`}
                      </span>
                      <span className="ml-2 text-[11px] text-[#999999]" style={lato}>
                        {r.duration_seconds}s
                      </span>
                    </div>
                    <span
                      style={jost}
                      className={`inline-block px-2 py-0.5 text-[9px] tracking-wide ${
                        r.status === 'active'
                          ? 'bg-[#2E7D32] text-[#FFFFFF]'
                          : r.status === 'completed'
                            ? 'bg-[#111111] text-[#FFFFFF]'
                            : 'bg-[#F4F4F4] text-[#666666]'
                      }`}
                    >
                      {r.status === 'active'
                        ? 'EN VIVO'
                        : r.status === 'completed'
                          ? 'TERMINADA'
                          : 'SETUP'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* LOBBY DE ASIGNACIÓN */}
          {activeRound && activeRound.status === 'setup' && (
            <section>
              <h2
                style={{ ...jost, fontSize: 11, letterSpacing: '0.12em' }}
                className="mb-3 text-[#999999]"
              >
                LOBBY — {activeRound.name || `Ronda ${activeRound.round_number}`}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p style={jost} className="mb-2 text-[10px] tracking-[0.12em] text-[#CC4B37]">
                    ÁRBITROS DISPONIBLES
                  </p>
                  <div className="max-h-[300px] overflow-y-auto border border-[#EEEEEE]">
                    {availableRefs.length === 0 ? (
                      <p className="p-4 text-[12px] text-[#999999]" style={lato}>
                        Todos asignados o sin árbitros conectados
                      </p>
                    ) : (
                      availableRefs.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() =>
                            setSelectedReferee(r.id === selectedReferee ? null : r.id)
                          }
                          className={`flex w-full items-center justify-between border-b border-[#F4F4F4] px-4 py-3 text-left last:border-0 ${
                            selectedReferee === r.id
                              ? 'bg-[#CC4B37]/10'
                              : 'bg-[#FFFFFF] hover:bg-[#FAFAFA]'
                          }`}
                        >
                          <span
                            className="text-[13px] font-semibold text-[#111111]"
                            style={lato}
                          >
                            {r.name || r.code}
                          </span>
                          <span className="font-mono text-[11px] text-[#999999]">
                            {r.code}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <p style={jost} className="mb-2 text-[10px] tracking-[0.12em] text-[#111111]">
                    JUGADORES DISPONIBLES
                  </p>
                  <div className="max-h-[300px] overflow-y-auto border border-[#EEEEEE]">
                    {availablePlayers.length === 0 ? (
                      <p className="p-4 text-[12px] text-[#999999]" style={lato}>
                        Todos asignados
                      </p>
                    ) : (
                      availablePlayers.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setSelectedPlayer(p.id === selectedPlayer ? null : p.id)
                          }
                          className={`flex w-full items-center justify-between border-b border-[#F4F4F4] px-4 py-3 text-left last:border-0 ${
                            selectedPlayer === p.id
                              ? 'bg-[#CC4B37]/10'
                              : 'bg-[#FFFFFF] hover:bg-[#FAFAFA]'
                          }`}
                        >
                          <span
                            className="text-[13px] font-semibold text-[#111111]"
                            style={lato}
                          >
                            {p.name}
                          </span>
                          {p.team_name && (
                            <span className="text-[11px] text-[#999999]" style={lato}>
                              {p.team_name}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {selectedReferee && selectedPlayer && (
                <button
                  type="button"
                  onClick={() => void handleAssign()}
                  disabled={assigning}
                  style={jost}
                  className={`${btnPrimary} mt-3 w-full`}
                >
                  {assigning ? 'ASIGNANDO...' : 'ASIGNAR ÁRBITRO ↔ JUGADOR'}
                </button>
              )}

              {assignments.length > 0 && (
                <div className="mt-4">
                  <p style={jost} className="mb-2 text-[10px] tracking-[0.12em] text-[#999999]">
                    ASIGNACIONES ({assignments.length})
                  </p>
                  <div className="border border-[#EEEEEE]">
                    {assignments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between border-b border-[#F4F4F4] px-4 py-2.5 last:border-0"
                      >
                        <div className="flex items-center gap-2 text-[12px]" style={lato}>
                          <span className="font-semibold text-[#CC4B37]">
                            {a.tournament_referees?.name ||
                              a.tournament_referees?.code ||
                              '?'}
                          </span>
                          <span className="text-[#999999]">→</span>
                          <span className="font-semibold text-[#111111]">
                            {a.tournament_players?.name || '?'}
                          </span>
                          {a.tournament_players?.team_name && (
                            <span className="text-[11px] text-[#999999]">
                              ({a.tournament_players.team_name})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleUnassign(a.id)}
                          className="text-[11px] text-[#CC4B37] hover:text-[#111111]"
                          style={lato}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignments.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleStartRound()}
                  style={jost}
                  className={`${btnDanger} mt-4 w-full text-[13px]`}
                >
                  INICIAR RONDA
                </button>
              )}
            </section>
          )}

          {/* RONDA EN VIVO */}
          {activeRound && activeRound.status === 'active' && (
            <section className="border-2 border-[#CC4B37] bg-[#111111] p-6">
              <div className="text-center">
                <p style={jost} className="text-[11px] tracking-[0.2em] text-[#CC4B37]">
                  EN VIVO — {activeRound.name || `Ronda ${activeRound.round_number}`}
                </p>
                <p className="mt-2 font-mono text-[64px] font-bold tabular-nums leading-none text-[#FFFFFF] md:text-[80px]">
                  {timeLeft !== null ? formatTimer(timeLeft) : '--:--'}
                </p>
                {timeLeft !== null && timeLeft <= 0 && (
                  <p style={jost} className="mt-2 text-[14px] tracking-[0.2em] text-[#CC4B37]">
                    TIEMPO AGOTADO
                  </p>
                )}
              </div>

              {scoreboard.length > 0 && (
                <div className="mt-6">
                  <div className="grid grid-cols-12 border-b border-[#333333] px-3 py-2">
                    <span style={jost} className="col-span-4 text-[9px] tracking-widest text-[#666666]">
                      JUGADOR
                    </span>
                    <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#666666]">
                      K
                    </span>
                    <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#666666]">
                      D
                    </span>
                    <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#666666]">
                      FK
                    </span>
                    <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#666666]">
                      OBJ
                    </span>
                    <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#666666]">
                      KA
                    </span>
                    <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#666666]">
                      CA
                    </span>
                    <span style={jost} className="col-span-2 text-right text-[9px] tracking-widest text-[#CC4B37]">
                      SCORE
                    </span>
                  </div>
                  {scoreboard.map((s, i) => (
                    <div
                      key={s.player_id}
                      className={`grid grid-cols-12 items-center px-3 py-2 ${
                        i < scoreboard.length - 1 ? 'border-b border-[#222222]' : ''
                      }`}
                    >
                      <div className="col-span-4 min-w-0">
                        <p className="truncate text-[12px] font-semibold text-[#FFFFFF]" style={lato}>
                          {s.name}
                        </p>
                        {s.team_name && (
                          <p className="truncate text-[10px] text-[#666666]" style={lato}>
                            {s.team_name}
                          </p>
                        )}
                      </div>
                      <span className="col-span-1 text-center text-[13px] font-bold tabular-nums text-[#FFFFFF]" style={lato}>
                        {s.kills}
                      </span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#999999]" style={lato}>
                        {s.deaths}
                      </span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#FFFFFF]" style={lato}>
                        {s.first_kills}
                      </span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#FFFFFF]" style={lato}>
                        {s.objectives}
                      </span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#FFFFFF]" style={lato}>
                        {s.key_actions}
                      </span>
                      <span className="col-span-1 text-center text-[13px] tabular-nums text-[#FFFFFF]" style={lato}>
                        {s.critical_actions}
                      </span>
                      <span className="col-span-2 text-right text-[15px] font-bold tabular-nums text-[#CC4B37]" style={lato}>
                        {s.total_score}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleEndRound()}
                style={jost}
                className="mt-6 w-full border border-[#CC4B37] bg-transparent px-5 py-3 text-[11px] tracking-[0.12em] text-[#CC4B37] transition-colors hover:bg-[#CC4B37] hover:text-[#FFFFFF]"
              >
                TERMINAR RONDA
              </button>
            </section>
          )}

          {/* RONDA COMPLETADA */}
          {activeRound && activeRound.status === 'completed' && (
            <section className="border border-[#EEEEEE] p-4">
              <p style={jost} className="text-[11px] tracking-[0.12em] text-[#999999]">
                RONDA COMPLETADA —{' '}
                {activeRound.name || `Ronda ${activeRound.round_number}`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setScoreRoundId(activeRound.id)
                  setSubTab('scoreboard')
                  void loadScoreboard(activeRound.id)
                }}
                style={jost}
                className={`${btnPrimary} mt-3`}
              >
                VER SCOREBOARD
              </button>
            </section>
          )}
        </div>
      )}

      {/* ═══════════════ TAB: SCOREBOARD ═══════════════ */}
      {subTab === 'scoreboard' && isCreator && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {(tournament.rounds || []).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setScoreRoundId(r.id)
                  void loadScoreboard(r.id)
                }}
                style={jost}
                className={`border px-4 py-2 text-[10px] tracking-[0.12em] transition-colors ${
                  scoreRoundId === r.id
                    ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                    : 'border-[#EEEEEE] text-[#666666] hover:border-[#CC4B37]'
                }`}
              >
                {r.name || `Ronda ${r.round_number}`}
              </button>
            ))}
          </div>

          {scoreboard.length === 0 ? (
            <p className="text-[13px] text-[#666666]" style={lato}>
              {scoreRoundId ? 'Sin datos aún' : 'Selecciona una ronda'}
            </p>
          ) : (
            <div className="border border-[#EEEEEE]">
              <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2">
                <span style={jost} className="col-span-1 text-[9px] tracking-widest text-[#999999]">
                  #
                </span>
                <span style={jost} className="col-span-3 text-[9px] tracking-widest text-[#999999]">
                  JUGADOR
                </span>
                <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">
                  K
                </span>
                <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">
                  D
                </span>
                <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">
                  FK
                </span>
                <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">
                  OBJ
                </span>
                <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">
                  KA
                </span>
                <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">
                  CA
                </span>
                <span style={jost} className="col-span-2 text-right text-[9px] tracking-widest text-[#CC4B37]">
                  TOTAL
                </span>
              </div>
              {scoreboard.map((s, i) => (
                <div
                  key={s.player_id}
                  className={`grid grid-cols-12 items-center px-4 py-3 ${
                    i < scoreboard.length - 1 ? 'border-b border-[#F4F4F4]' : ''
                  } hover:bg-[#FAFAFA]`}
                >
                  <span className="col-span-1 text-[12px] font-bold text-[#999999]" style={lato}>
                    {i + 1}
                  </span>
                  <div className="col-span-3 min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#111111]" style={lato}>
                      {s.name}
                    </p>
                    {s.team_name && (
                      <p className="truncate text-[10px] text-[#999999]" style={lato}>
                        {s.team_name}
                      </p>
                    )}
                  </div>
                  <span className="col-span-1 text-center text-[13px] font-bold tabular-nums text-[#111111]" style={lato}>
                    {s.kills}
                  </span>
                  <span className="col-span-1 text-center text-[13px] tabular-nums text-[#666666]" style={lato}>
                    {s.deaths}
                  </span>
                  <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>
                    {s.first_kills}
                  </span>
                  <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>
                    {s.objectives}
                  </span>
                  <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>
                    {s.key_actions}
                  </span>
                  <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>
                    {s.critical_actions}
                  </span>
                  <span className="col-span-2 text-right text-[15px] font-bold tabular-nums text-[#CC4B37]" style={lato}>
                    {s.total_score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista para árbitro (no creador) */}
      {!isCreator && (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-[48px]" role="img" aria-label="Reloj de arena">
            ⏳
          </span>
          <p
            className="mt-4 text-[16px] font-extrabold uppercase tracking-[0.15em] text-[#111111]"
            style={jost}
          >
            ESPERANDO INICIO
          </p>
          <p className="mt-2 text-center text-[13px] text-[#666666]" style={lato}>
            Cuando el productor inicie la ronda, entrarás automáticamente al modo de
            arbitraje.
          </p>
          {myRefereeRecord && (
            <p className="mt-3 font-mono text-[16px] font-bold tracking-widest text-[#111111]">
              {myRefereeRecord.code}
            </p>
          )}
          <div className="mt-6 flex items-center gap-2">
            <span className="inline-block h-[8px] w-[8px] animate-pulse rounded-full bg-[#CC4B37]" />
            <span
              className="text-[11px] uppercase tracking-[0.12em] text-[#999999]"
              style={jost}
            >
              Conectado — escuchando
            </span>
          </div>

          {completedRoundsForReferee.length > 0 && (
            <div className="mt-8 w-full max-w-[400px]">
              <p
                style={jost}
                className="mb-2 text-center text-[10px] tracking-[0.12em] text-[#999999]"
              >
                RONDAS COMPLETADAS
              </p>
              <div className="flex flex-col gap-2">
                {completedRoundsForReferee.map((r) => (
                  <div key={r.id} className="border border-[#EEEEEE] px-4 py-3 text-center">
                    <span className="text-[13px] text-[#111111]" style={lato}>
                      {r.name || `Ronda ${r.round_number}`}
                    </span>
                    <span
                      style={jost}
                      className="ml-2 inline-block bg-[#111111] px-2 py-0.5 text-[9px] text-[#FFFFFF]"
                    >
                      TERMINADA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
