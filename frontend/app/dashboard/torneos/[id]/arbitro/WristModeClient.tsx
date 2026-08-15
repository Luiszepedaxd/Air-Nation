'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'

type ActionType =
  | 'kill'
  | 'death'
  | 'first_kill'
  | 'objective'
  | 'key_action'
  | 'critical_action'

type QueuedAction = {
  action_type: ActionType
  recorded_at: string
  client_event_id: string
  synced: boolean
}

type RoundInfo = {
  id: string
  tournament_id: string
  status: 'setup' | 'active' | 'completed'
  started_at: string | null
  duration_seconds: number
}

type PlayerInfo = {
  id: string
  name: string
  team_name: string | null
}

type AssignmentInfo = {
  id: string
  player_id: string
  tournament_players: PlayerInfo
}

const jostFont = { fontFamily: "'Jost', sans-serif" } as const
const latoFont = { fontFamily: "'Lato', sans-serif" } as const

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Beeps con Web Audio API, sin archivos de audio ─────────
// Un solo AudioContext compartido: los navegadores limitan cuántos puede abrir
// un documento, y aquí se crean beeps en cada ronda.
let sharedAudioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof window.AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  if (!sharedAudioContext) sharedAudioContext = new Ctor()
  if (sharedAudioContext.state === 'suspended') void sharedAudioContext.resume()
  return sharedAudioContext
}

function playBeep(frequency: number, duration: number, count = 1) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = frequency
      osc.type = 'square'

      const startTime = ctx.currentTime + i * (duration + 0.1)
      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

      osc.start(startTime)
      osc.stop(startTime + duration)
    }
  } catch {
    /* audio no soportado o bloqueado */
  }
}

function playStartSound() {
  playBeep(880, 0.15, 3)
}

function playEndSound() {
  playBeep(220, 0.5, 1)
}

export function WristModeClient({
  tournamentId,
  roundId,
  userId,
}: {
  tournamentId: string
  roundId: string
  userId: string
}) {
  const [round, setRound] = useState<RoundInfo | null>(null)
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [actions, setActions] = useState<QueuedAction[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(`tournament_actions_${roundId}`)
      if (stored) {
        const parsed = JSON.parse(stored) as QueuedAction[]
        return Array.isArray(parsed) ? parsed : []
      }
    } catch {
      /* ignore */
    }
    return []
  })
  const actionsRef = useRef<QueuedAction[]>([])

  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>(
    'synced'
  )
  const syncRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [flash, setFlash] = useState<string | null>(null)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [globalFirstKillTaken, setGlobalFirstKillTaken] = useState(false)
  const [firstKillPlayerName, setFirstKillPlayerName] = useState<string | null>(null)

  const startSoundPlayedRef = useRef(false)
  const endSoundPlayedRef = useRef(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    let released = false

    async function requestWakeLock() {
      try {
        if (!('wakeLock' in navigator)) return
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null
          if (!released) void requestWakeLock()
        })
      } catch {
        /* wake lock not supported or denied */
      }
    }

    void requestWakeLock()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !released) {
        void requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', handleVisibility)
      if (wakeLockRef.current) {
        void wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  useEffect(() => {
    try {
      if (actions.length > 0) {
        localStorage.setItem(`tournament_actions_${roundId}`, JSON.stringify(actions))
      } else {
        localStorage.removeItem(`tournament_actions_${roundId}`)
      }
    } catch {
      /* storage full or unavailable */
    }
  }, [actions, roundId])

  useEffect(() => {
    if (actions.length > 0 && actions.every((a) => a.synced)) {
      try {
        localStorage.removeItem(`tournament_actions_${roundId}`)
      } catch {
        /* ignore */
      }
    }
  }, [actions, roundId])

  useEffect(() => {
    const hasPending = actions.some((a) => !a.synced)
    if (!hasPending) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [actions])

  useEffect(() => {
    return () => {
      if (flashTimeout.current) clearTimeout(flashTimeout.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    startSoundPlayedRef.current = false
    endSoundPlayedRef.current = false
    async function load() {
      try {
        const res = await apiFetch(`/tournaments/referee/assignment/${roundId}`)
        if (!res.ok) throw new Error('No se pudo cargar tu asignación')
        const data = await res.json()
        if (cancelled) return
        setRound(data.round || null)
        setAssignment(data.assignment || null)
        if (!data.assignment) setError('No tienes asignación en esta ronda')
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [roundId])

  // El timer se reconstruye desde started_at, no desde un contador local,
  // para que recargar o volver a entrar no regale tiempo extra.
  const roundStartedAt = round?.started_at
  const roundStatus = round?.status
  const roundDuration = round?.duration_seconds

  const syncActions = useCallback(async () => {
    const pending = actionsRef.current.filter((a) => !a.synced)
    if (pending.length === 0) {
      setSyncStatus('synced')
      return
    }

    setSyncStatus('pending')

    try {
      const res = await apiFetch(
        `/tournaments/${tournamentId}/rounds/${roundId}/actions`,
        {
          method: 'POST',
          body: JSON.stringify({
            actions: pending.map((a) => ({
              action_type: a.action_type,
              recorded_at: a.recorded_at,
              client_event_id: a.client_event_id,
            })),
          }),
        }
      )

      if (res.ok) {
        const syncedIds = new Set(pending.map((a) => a.client_event_id))
        setActions((prev) =>
          prev.map((a) =>
            syncedIds.has(a.client_event_id) ? { ...a, synced: true } : a
          )
        )
        setSyncStatus('synced')
      } else {
        setSyncStatus('offline')
      }
    } catch {
      setSyncStatus('offline')
    }
  }, [tournamentId, roundId])

  useEffect(() => {
    if (!roundStartedAt || roundStatus !== 'active' || !roundDuration) return

    const endMs = new Date(roundStartedAt).getTime() + roundDuration * 1000

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endMs - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0 && !endSoundPlayedRef.current) {
        endSoundPlayedRef.current = true
        playEndSound()
        void syncActions()
      }
    }

    // Entrar tarde a una ronda ya vencida no debe sonar como un arranque.
    if (!startSoundPlayedRef.current && endMs - Date.now() > 0) {
      startSoundPlayedRef.current = true
      playStartSound()
    }

    tick()
    timerRef.current = setInterval(tick, 250)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [roundStartedAt, roundStatus, roundDuration, syncActions])

  useEffect(() => {
    const hasPending = actionsRef.current.some((a) => !a.synced)
    const timeExpired = timeLeft !== null && timeLeft <= 0
    const interval = timeExpired && hasPending ? 1000 : 3000

    syncRef.current = setInterval(() => void syncActions(), interval)
    return () => {
      if (syncRef.current) clearInterval(syncRef.current)
    }
  }, [syncActions, timeLeft, actions])

  useEffect(() => {
    void syncActions()
  }, [syncActions])

  useEffect(() => {
    const poll = setInterval(() => {
      void (async () => {
        try {
          const res = await apiFetch(
            `/tournaments/referee/assignment/${roundId}`
          )
          if (res.ok) {
            const data = await res.json()
            if (data.round) setRound(data.round)
          }
        } catch {
          /* offline, ignorar */
        }
      })()
    }, 5000)

    return () => clearInterval(poll)
  }, [roundId])

  useEffect(() => {
    if (round?.status !== 'active') return

    const checkFirstKill = async () => {
      try {
        const res = await apiFetch(
          `/tournaments/${tournamentId}/rounds/${roundId}/first-kill`
        )
        if (res.ok) {
          const data = await res.json()
          setGlobalFirstKillTaken(data.exists)
          if (data.exists) setFirstKillPlayerName(data.player_name)
        }
      } catch {
        /* offline, ignore */
      }
    }

    void checkFirstKill()
    const interval = setInterval(() => void checkFirstKill(), 2000)
    return () => clearInterval(interval)
  }, [round?.status, tournamentId, roundId])

  const recordAction = useCallback(
    (type: ActionType) => {
      if (timeLeft !== null && timeLeft <= 0) return
      if (round?.status !== 'active') return
      if (type === 'first_kill' && globalFirstKillTaken) return

      const action: QueuedAction = {
        action_type: type,
        recorded_at: new Date().toISOString(),
        client_event_id: `${userId}-${roundId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        synced: false,
      }

      // actionsRef se actualiza aquí y no solo en el efecto para que el sync
      // inmediato de abajo ya incluya esta acción.
      const next = [...actionsRef.current, action]
      actionsRef.current = next
      setActions(next)

      if (flashTimeout.current) clearTimeout(flashTimeout.current)
      setFlash(type)
      flashTimeout.current = setTimeout(() => setFlash(null), 300)

      void syncActions()
    },
    [timeLeft, round?.status, userId, roundId, syncActions, globalFirstKillTaken]
  )

  // Solo revierte en local: lo ya sincronizado se queda en el servidor.
  const undoLast = useCallback(() => {
    setActions((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)))
  }, [])

  const counts = actions.reduce(
    (acc, a) => {
      if (a.action_type === 'kill') acc.kills++
      else if (a.action_type === 'death') acc.deaths++
      else if (a.action_type === 'first_kill') acc.first_kills++
      else if (a.action_type === 'objective') acc.objectives++
      else if (a.action_type === 'key_action') acc.key_actions++
      else if (a.action_type === 'critical_action') acc.critical_actions++
      return acc
    },
    {
      kills: 0,
      deaths: 0,
      first_kills: 0,
      objectives: 0,
      key_actions: 0,
      critical_actions: 0,
    }
  )

  const totalActions =
    counts.kills +
    counts.deaths +
    counts.first_kills +
    counts.objectives +
    counts.key_actions +
    counts.critical_actions

  const pendingCount = actions.filter((a) => !a.synced).length

  const syncDotColor =
    syncStatus === 'synced'
      ? '#2E7D32'
      : syncStatus === 'pending'
        ? '#F9A825'
        : '#CC4B37'

  const buttonsDisabled =
    round?.status !== 'active' || (timeLeft !== null && timeLeft <= 0)

  // Solo hay un first kill por ronda (global). Deshacer lo local solo re-habilita
  // si nadie más lo registró en el servidor.
  const firstKillUsed = counts.first_kills >= 1

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#111111] px-3 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-3">
        <p className="text-[14px] text-[#999999]" style={latoFont}>
          Cargando...
        </p>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#111111] px-6 pb-2 pt-2 sm:pb-3 sm:pt-3">
        <p className="text-center text-[14px] text-[#CC4B37]" style={latoFont}>
          {error || 'Sin asignación en esta ronda'}
        </p>
        <Link
          href={`/dashboard/torneos/${tournamentId}`}
          className="mt-4 text-[12px] text-[#666666] underline"
          style={latoFont}
        >
          ← Volver al torneo
        </Link>
      </div>
    )
  }

  const player = assignment.tournament_players

  if (round && round.status === 'completed') {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#111111] px-6 pb-2 pt-2 sm:pb-3 sm:pt-3">
        <p
          className="text-[16px] font-extrabold uppercase tracking-[0.2em] text-[#FFFFFF]"
          style={jostFont}
        >
          RONDA TERMINADA
        </p>
        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <p className="text-[32px] font-bold tabular-nums text-[#CC4B37]">
              {counts.kills}
            </p>
            <p
              className="text-[10px] uppercase tracking-widest text-[#666666]"
              style={jostFont}
            >
              Kills
            </p>
          </div>
          <div className="text-center">
            <p className="text-[32px] font-bold tabular-nums text-[#FFFFFF]">
              {counts.deaths}
            </p>
            <p
              className="text-[10px] uppercase tracking-widest text-[#666666]"
              style={jostFont}
            >
              Deaths
            </p>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-[#999999]" style={latoFont}>
          {totalActions} acciones registradas
        </p>
        {actions.some((a) => !a.synced) ? (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block h-[8px] w-[8px] animate-pulse rounded-full bg-[#F9A825]" />
              <span className="text-[12px] text-[#F9A825]" style={latoFont}>
                Sincronizando {actions.filter((a) => !a.synced).length} acciones...
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#666666]" style={latoFont}>
              No cierres la app
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#2E7D32]" />
              <span className="text-[12px] text-[#2E7D32]" style={latoFont}>
                ✓ Todo sincronizado
              </span>
            </div>
            <Link
              href={`/dashboard/torneos/${tournamentId}`}
              className="mt-4 inline-block text-[12px] text-[#666666] underline"
              style={latoFont}
            >
              ← Volver al torneo
            </Link>
          </div>
        )}
      </div>
    )
  }

  if (round?.status === 'setup') {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#111111] px-6 pb-2 pt-2 sm:pb-3 sm:pt-3">
        <p
          className="text-[14px] uppercase tracking-[0.2em] text-[#999999]"
          style={jostFont}
        >
          Esperando inicio...
        </p>
        <p className="mt-3 text-[18px] font-bold text-[#FFFFFF]" style={latoFont}>
          {player.name}
        </p>
        {player.team_name && (
          <p className="mt-1 text-[13px] text-[#CC4B37]" style={latoFont}>
            {player.team_name}
          </p>
        )}
        <Link
          href={`/dashboard/torneos/${tournamentId}`}
          className="mt-6 text-[12px] text-[#666666] underline"
          style={latoFont}
        >
          ← Volver al torneo
        </Link>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[9999] select-none overflow-hidden bg-[#111111] px-3 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-3"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Barra superior: jugador + timer + sync */}
      <div className="flex h-[48px] items-center justify-between px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#FFFFFF]"
            style={jostFont}
          >
            {player.name}
          </span>
          {player.team_name && (
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#CC4B37]"
              style={jostFont}
            >
              {player.team_name}
            </span>
          )}
        </div>

        <div className="text-center">
          <span
            className={`font-mono text-[22px] font-bold tabular-nums leading-none ${
              timeLeft !== null && timeLeft <= 30
                ? 'text-[#CC4B37]'
                : 'text-[#FFFFFF]'
            }`}
          >
            {timeLeft !== null ? formatTimer(timeLeft) : '--:--'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[14px] font-bold tabular-nums text-[#2E7D32]">
            {counts.kills}K
          </span>
          <span className="font-mono text-[14px] tabular-nums text-[#999999]">
            {counts.deaths}D
          </span>
          <span
            className="h-[8px] w-[8px] rounded-full"
            style={{ backgroundColor: syncDotColor }}
            title={
              syncStatus === 'synced'
                ? 'Sincronizado'
                : syncStatus === 'pending'
                  ? 'Sincronizando...'
                  : 'Sin conexión'
            }
          />
        </div>
      </div>

      {/* Botones principales */}
      <div className="flex h-[calc(100dvh-48px-44px)] flex-col gap-[6px] px-[6px] pb-[3px]">
        <div className="flex flex-1 gap-[6px]">
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => recordAction('kill')}
            className={`flex flex-[1.2] items-center justify-center transition-all active:scale-[0.96] disabled:opacity-30 ${
              flash === 'kill' ? 'bg-[#FF1C1C]' : 'bg-[#CC4B37]'
            }`}
            style={{ ...jostFont, borderRadius: 4 }}
          >
            <span className="text-[28px] font-extrabold uppercase tracking-[0.1em] text-[#FFFFFF] sm:text-[36px]">
              KILL
            </span>
          </button>
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => recordAction('death')}
            className={`flex flex-1 items-center justify-center transition-all active:scale-[0.96] disabled:opacity-30 ${
              flash === 'death' ? 'bg-[#555555]' : 'bg-[#333333]'
            }`}
            style={{ ...jostFont, borderRadius: 4 }}
          >
            <span className="text-[28px] font-extrabold uppercase tracking-[0.1em] text-[#FFFFFF] sm:text-[36px]">
              DEATH
            </span>
          </button>
        </div>

        <div className="flex h-[64px] gap-[6px] sm:h-[72px]">
          <button
            type="button"
            disabled={buttonsDisabled || firstKillUsed || globalFirstKillTaken}
            onClick={() => recordAction('first_kill')}
            className={`flex flex-1 items-center justify-center border transition-all active:scale-[0.96] ${
              firstKillUsed
                ? 'border-[#2E7D32] bg-[#1A2E1A]'
                : globalFirstKillTaken
                  ? 'border-[#333333] bg-[#1A1A1A] opacity-40'
                  : flash === 'first_kill'
                    ? 'border-[#333333] bg-[#333333]'
                    : 'border-[#333333] bg-[#1A1A1A]'
            } disabled:opacity-30`}
            style={{ ...jostFont, borderRadius: 4 }}
          >
            <span
              className={`text-center text-[10px] font-extrabold uppercase leading-tight tracking-[0.08em] sm:text-[12px] ${
                firstKillUsed
                  ? 'text-[#2E7D32]'
                  : globalFirstKillTaken
                    ? 'text-[#666666]'
                    : 'text-[#FFFFFF]'
              }`}
            >
              {firstKillUsed ? (
                <>
                  ✓ FIRST
                  <br />
                  KILL
                </>
              ) : globalFirstKillTaken ? (
                <>
                  FIRST KILL
                  <br />
                  <span className="text-[8px] normal-case">
                    {firstKillPlayerName || 'Tomado'}
                  </span>
                </>
              ) : (
                <>
                  FIRST
                  <br />
                  KILL
                </>
              )}
            </span>
          </button>
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => recordAction('objective')}
            className={`flex flex-1 items-center justify-center border border-[#333333] transition-all active:scale-[0.96] disabled:opacity-30 ${
              flash === 'objective' ? 'bg-[#333333]' : 'bg-[#1A1A1A]'
            }`}
            style={{ ...jostFont, borderRadius: 4 }}
          >
            <span className="text-center text-[10px] font-extrabold uppercase leading-tight tracking-[0.08em] text-[#FFFFFF] sm:text-[12px]">
              OBJECTIVE
            </span>
          </button>
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => recordAction('key_action')}
            className={`flex flex-1 items-center justify-center border border-[#333333] transition-all active:scale-[0.96] disabled:opacity-30 ${
              flash === 'key_action' ? 'bg-[#333333]' : 'bg-[#1A1A1A]'
            }`}
            style={{ ...jostFont, borderRadius: 4 }}
          >
            <span className="text-center text-[10px] font-extrabold uppercase leading-tight tracking-[0.08em] text-[#FFFFFF] sm:text-[12px]">
              KEY
              <br />
              ACTION
            </span>
          </button>
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => recordAction('critical_action')}
            className={`flex flex-1 items-center justify-center border transition-all active:scale-[0.96] disabled:opacity-30 ${
              flash === 'critical_action'
                ? 'border-[#FF1C1C] bg-[#331111]'
                : 'border-[#CC4B37] bg-[#1A1A1A]'
            }`}
            style={{ ...jostFont, borderRadius: 4 }}
          >
            <span className="text-center text-[10px] font-extrabold uppercase leading-tight tracking-[0.08em] text-[#CC4B37] sm:text-[12px]">
              CRITICAL
              <br />
              ACTION
            </span>
          </button>
        </div>
      </div>

      {/* Barra inferior: deshacer + estado */}
      <div className="flex h-[44px] items-center justify-between px-3">
        <button
          type="button"
          onClick={undoLast}
          disabled={actions.length === 0 || buttonsDisabled}
          className="text-[11px] uppercase tracking-[0.1em] text-[#666666] transition-colors hover:text-[#CC4B37] disabled:opacity-30"
          style={jostFont}
        >
          ↩ DESHACER
        </button>

        <div className="flex items-center gap-4">
          <span className="text-[10px] tabular-nums text-[#666666]" style={latoFont}>
            FK:{counts.first_kills} OBJ:{counts.objectives} KA:{counts.key_actions}{' '}
            CA:{counts.critical_actions}
          </span>
          {pendingCount > 0 && (
            <span className="text-[10px] text-[#F9A825]" style={latoFont}>
              {pendingCount} pendientes
            </span>
          )}
        </div>
      </div>

      {/* Overlay de tiempo agotado */}
      {timeLeft !== null && timeLeft <= 0 && (
        <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-[#111111]/95 px-3 pb-2 pt-2 sm:px-4 sm:pb-3 sm:pt-3">
          <div className="text-center">
            <p
              className="text-[24px] font-extrabold uppercase tracking-[0.3em] text-[#CC4B37]"
              style={jostFont}
            >
              TIEMPO
            </p>
            <p
              className="mt-1 text-[24px] font-extrabold uppercase tracking-[0.3em] text-[#FFFFFF]"
              style={jostFont}
            >
              AGOTADO
            </p>
            <div className="mt-6 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-[40px] font-bold tabular-nums text-[#CC4B37]">
                  {counts.kills}
                </p>
                <p
                  className="text-[10px] uppercase tracking-widest text-[#666666]"
                  style={jostFont}
                >
                  K
                </p>
              </div>
              <div className="text-center">
                <p className="text-[40px] font-bold tabular-nums text-[#FFFFFF]">
                  {counts.deaths}
                </p>
                <p
                  className="text-[10px] uppercase tracking-widest text-[#666666]"
                  style={jostFont}
                >
                  D
                </p>
              </div>
            </div>

            {actions.some((a) => !a.synced) ? (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-[8px] w-[8px] animate-pulse rounded-full bg-[#F9A825]" />
                  <span
                    className="text-[13px] font-semibold text-[#F9A825]"
                    style={latoFont}
                  >
                    Sincronizando {actions.filter((a) => !a.synced).length} acciones...
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[#666666]" style={latoFont}>
                  No cierres la app. Esperando conexión...
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#2E7D32]" />
                  <span
                    className="text-[13px] font-semibold text-[#2E7D32]"
                    style={latoFont}
                  >
                    ✓ Todo sincronizado
                  </span>
                </div>
                <Link
                  href={`/dashboard/torneos/${tournamentId}`}
                  className="mt-4 inline-block text-[12px] text-[#666666] underline"
                  style={latoFont}
                >
                  ← Volver al torneo
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
