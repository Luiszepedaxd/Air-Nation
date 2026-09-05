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
  | 'foul'
  | 'drill_complete'

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
  game_type: 'speedsoft' | 'tactical_arena' | 'drills' | null
  foul_penalty_seconds: number | null
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

type DrillQueueItem = {
  id: string
  player_id: string
  tournament_players: PlayerInfo
  drill_started_at: string | null
  drill_completed_at: string | null
  drill_order: number | null
  fouls: number
  completed: boolean
  sync_confirmed_at: string | null
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
  const [gameType, setGameType] = useState<'speedsoft' | 'tactical_arena' | 'drills'>('speedsoft')

  const [actions, setActions] = useState<QueuedAction[]>([])
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

  const [syncConfirmed, setSyncConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Drills: cronómetro ascendente
  const [drillElapsed, setDrillElapsed] = useState(0)
  const [drillFinished, setDrillFinished] = useState(false)
  const drillTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [drillQueue, setDrillQueue] = useState<DrillQueueItem[]>([])
  const [currentDrillIdx, setCurrentDrillIdx] = useState<number | null>(null)
  const [drillPhase, setDrillPhase] = useState<'queue' | 'active' | 'done'>('queue')

  const storageKey = `tournament_actions_${roundId}${gameType === 'drills' && assignment ? `_${assignment.id}` : ''}`

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
      if (typeof window === 'undefined') return
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as QueuedAction[]
        const arr = Array.isArray(parsed) ? parsed : []
        setActions(arr)
        actionsRef.current = arr
        return
      }
      setActions([])
      actionsRef.current = []
    } catch {
      setActions([])
      actionsRef.current = []
    }
  }, [storageKey])

  useEffect(() => {
    try {
      if (actions.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(actions))
      } else {
        localStorage.removeItem(storageKey)
      }
    } catch {
      /* storage full or unavailable */
    }
  }, [actions, storageKey])

  useEffect(() => {
    if (actions.length > 0 && actions.every((a) => a.synced)) {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        /* ignore */
      }
    }
  }, [actions, storageKey])

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
        if (data.round?.game_type) setGameType(data.round.game_type)
        setAssignment(data.assignment || null)
        if (!data.assignment && data.round?.game_type !== 'drills') {
          setError('No tienes asignación en esta ronda')
        }
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

  // ── Verificación global de First Kill ───────────────────────────────────────
  // Se extrae como useCallback para poder invocarlo también al final de cada
  // sync exitoso, no solo desde el intervalo de 2 s. Esto cierra el gap de
  // ~2 s en el que un segundo árbitro podría haber dado click antes del poll.
  const checkFirstKill = useCallback(async () => {
    try {
      const res = await apiFetch(
        `/tournaments/${tournamentId}/rounds/${roundId}/first-kill`
      )
      if (res.ok) {
        const data = await res.json() as { exists: boolean; player_name: string | null }
        setGlobalFirstKillTaken(data.exists)
        if (data.exists) setFirstKillPlayerName(data.player_name)
      }
    } catch {
      /* offline, ignorar */
    }
  }, [tournamentId, roundId])

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
            assignment_id: assignment?.id,
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
        // También actualizar el ref para evitar reintentos fantasma
        actionsRef.current = actionsRef.current.map((a) =>
          syncedIds.has(a.client_event_id) ? { ...a, synced: true } : a
        )
        // Si este batch incluía un first_kill, o si había un first_kill pendiente,
        // verificamos el estado global inmediatamente para reflejar si otro árbitro
        // se adelantó (cierra el gap de ~2 s del intervalo fijo).
        const hadFirstKill = pending.some((a) => a.action_type === 'first_kill')
        if (hadFirstKill || !globalFirstKillTaken) {
          void checkFirstKill()
        }
      } else {
        setSyncStatus('offline')
        try {
          const errData = await res.json()
          console.error('Sync error:', errData.error)
        } catch { /* ignore */ }
      }
    } catch {
      setSyncStatus('offline')
    }
  }, [tournamentId, roundId, checkFirstKill, globalFirstKillTaken, assignment?.id])

  const handleConfirmSync = async () => {
    setConfirming(true)
    try {
      const res = await apiFetch(
        `/tournaments/${tournamentId}/rounds/${roundId}/confirm-sync`,
        {
          method: 'PATCH',
          body: JSON.stringify({ assignment_id: assignment?.id }),
        }
      )
      if (res.ok) {
        setSyncConfirmed(true)
        if (gameType === 'drills') {
          const nextIdx = drillQueue.findIndex(
            (q, i) => i > (currentDrillIdx ?? -1) && !q.completed
          )
          if (nextIdx >= 0) {
            setTimeout(() => {
              setSyncConfirmed(false)
              setDrillFinished(false)
              setDrillPhase('queue')
              setAssignment(null)
              setActions([])
              actionsRef.current = []
              setCurrentDrillIdx(null)
            }, 1500)
          } else {
            setTimeout(() => {
              setDrillPhase('done')
            }, 1500)
          }
        }
      }
    } catch { /* silenciar */ }
    finally { setConfirming(false) }
  }

  useEffect(() => {
    if (gameType === 'drills') return
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
  }, [gameType, roundStartedAt, roundStatus, roundDuration, syncActions])

  // ── Timer ascendente para drills ───────────────────────────
  useEffect(() => {
    if (gameType !== 'drills') return
    if (roundStatus !== 'active') return
    if (drillFinished) return
    if (drillPhase !== 'active') return

    const currentDrill = currentDrillIdx !== null ? drillQueue[currentDrillIdx] : null
    const drillStart = currentDrill?.drill_started_at
    if (!drillStart) return

    const startedMs = new Date(drillStart).getTime()

    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
      setDrillElapsed(elapsed)
    }

    tick()
    drillTimerRef.current = setInterval(tick, 250)

    return () => {
      if (drillTimerRef.current) {
        clearInterval(drillTimerRef.current)
        drillTimerRef.current = null
      }
    }
  }, [gameType, roundStatus, drillFinished, drillPhase, currentDrillIdx, drillQueue])

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
            if (data.round) {
              setRound(data.round)
              if (data.round.game_type) setGameType(data.round.game_type)
            }
          }
        } catch {
          /* offline, ignorar */
        }
      })()
    }, 5000)

    return () => clearInterval(poll)
  }, [roundId])

  // ── Cargar cola de drills ──────────────────────────────────
  useEffect(() => {
    if (gameType !== 'drills') return
    if (!round || round.status !== 'active') return

    const loadQueue = async () => {
      try {
        const res = await apiFetch(`/tournaments/referee/drill-queue/${roundId}`)
        if (res.ok) {
          const data = await res.json()
          const queue = (data.assignments || []) as DrillQueueItem[]
          setDrillQueue(queue)

          const allDone = queue.length > 0 && queue.every((q) => q.completed)
          if (allDone) {
            setDrillPhase('done')
            return
          }

          const inProgress = queue.findIndex((q) => q.drill_started_at && !q.completed)
          if (inProgress >= 0 && drillPhase !== 'active') {
            setCurrentDrillIdx(inProgress)
            setDrillPhase('active')
            setAssignment({
              id: queue[inProgress].id,
              player_id: queue[inProgress].player_id,
              tournament_players: queue[inProgress].tournament_players,
            })
          } else if (!drillFinished && drillPhase !== 'active') {
            setDrillPhase('queue')
          }
        }
      } catch {
        /* silenciar */
      }
    }

    void loadQueue()
    const interval = setInterval(loadQueue, 5000)
    return () => clearInterval(interval)
  }, [gameType, round?.status, roundId, drillFinished, drillPhase])

  const handleStartDrill = async (queueItem: DrillQueueItem, idx: number) => {
    try {
      const res = await apiFetch(`/tournaments/referee/start-drill/${queueItem.id}`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error)
      }

      setCurrentDrillIdx(idx)
      setDrillPhase('active')
      setDrillFinished(false)
      setSyncConfirmed(false)
      setActions([])
      actionsRef.current = []
      setDrillElapsed(0)

      setAssignment({
        id: queueItem.id,
        player_id: queueItem.player_id,
        tournament_players: queueItem.tournament_players,
      })

      setDrillQueue((prev) =>
        prev.map((q, i) =>
          i === idx ? { ...q, drill_started_at: new Date().toISOString() } : q
        )
      )

      playStartSound()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  // Poll each 2 s while round is active. checkFirstKill is also called
  // immediately after every successful sync to close the race-condition gap.
  useEffect(() => {
    if (gameType === 'drills') return
    if (round?.status !== 'active') return

    void checkFirstKill()
    const interval = setInterval(() => void checkFirstKill(), 2000)
    return () => clearInterval(interval)
  }, [gameType, round?.status, checkFirstKill])

  const recordAction = useCallback(
    (type: ActionType) => {
      // Drills: no usa countdown, usa elapsed
      if (gameType === 'drills') {
        if (round?.status !== 'active') return
        if (drillFinished) return

        const action: QueuedAction = {
          action_type: type,
          recorded_at: new Date().toISOString(),
          client_event_id: `${userId}-${roundId}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          synced: false,
        }

        actionsRef.current = [...actionsRef.current, action]
        setActions((prev) => [...prev, action])

        if (flashTimeout.current) clearTimeout(flashTimeout.current)
        setFlash(type)
        flashTimeout.current = setTimeout(() => setFlash(null), 300)

        if (type === 'drill_complete') {
          setDrillFinished(true)
          playEndSound()

          setDrillQueue((prev) =>
            prev.map((q, i) => (i === currentDrillIdx ? { ...q, completed: true } : q))
          )
        }

        void syncActions()
        return
      }

      // Speedsoft / Tactical: lógica existente
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
    [gameType, drillFinished, timeLeft, round?.status, userId, roundId, syncActions, globalFirstKillTaken, currentDrillIdx]
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
      else if (a.action_type === 'foul') acc.fouls++
      else if (a.action_type === 'drill_complete') acc.drill_completes++
      return acc
    },
    {
      kills: 0,
      deaths: 0,
      first_kills: 0,
      objectives: 0,
      key_actions: 0,
      critical_actions: 0,
      fouls: 0,
      drill_completes: 0,
    }
  )

  const drillPenaltyTotal = counts.fouls * (round?.foul_penalty_seconds || 5)
  const drillFinalTime = drillElapsed + drillPenaltyTotal

  const totalActions =
    counts.kills +
    counts.deaths +
    counts.first_kills +
    counts.objectives +
    counts.key_actions +
    counts.critical_actions +
    counts.fouls +
    counts.drill_completes

  const pendingCount = actions.filter((a) => !a.synced).length

  const syncDotColor =
    syncStatus === 'synced'
      ? '#2E7D32'
      : syncStatus === 'pending'
        ? '#F9A825'
        : '#CC4B37'

  const buttonsDisabled =
    gameType === 'drills'
      ? round?.status !== 'active' || drillFinished || drillPhase !== 'active'
      : round?.status !== 'active' || (timeLeft !== null && timeLeft <= 0)

  // ── Configuración de botones secundarios según tipo de juego (AMG-2026.1) ──
  // Speedsoft: solo CONTROL POINT (captura CP enemigo). KEY ACTION y CRITICAL
  // ACTION no existen en las reglas de Speedsoft → se ocultan.
  // Tactical Arena: ENTREGA (objetivo), PORTADOR (evento portador, +5 pts),
  // ACTIVACIÓN (activación completada, +10 pts).
  type SecondaryBtn = {
    action: ActionType
    lines: [string, string?]   // max 2 líneas de texto
    accent?: boolean            // borde rojo (acciones críticas)
  }
  const secondaryButtons: SecondaryBtn[] = gameType === 'speedsoft'
    ? [
        { action: 'objective',        lines: ['CONTROL', 'POINT']  },
      ]
    : gameType === 'tactical_arena'
      ? [
          { action: 'objective',        lines: ['ENTREGA']            },
          { action: 'key_action',       lines: ['PORTADOR']           },
          { action: 'critical_action',  lines: ['ACTIVA', 'CIÓN'],  accent: true },
        ]
      : []

  // Solo hay un first kill por ronda (global). Deshacer lo local solo re-habilita
  // si nadie más lo registró en el servidor.
  const firstKillUsed = counts.first_kills >= 1

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#111111] px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
        <p className="text-[14px] text-[#999999]" style={latoFont}>
          Cargando...
        </p>
      </div>
    )
  }

  if (
    gameType === 'drills' &&
    round?.status === 'active' &&
    drillQueue.length === 0 &&
    !error
  ) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#111111] px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
        <p className="text-[14px] text-[#999999]" style={latoFont}>
          Cargando cola de jugadores...
        </p>
      </div>
    )
  }

  if (error || (!assignment && gameType !== 'drills')) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#111111] px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
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

  const queuePlayer =
    currentDrillIdx !== null
      ? drillQueue[currentDrillIdx]?.tournament_players
      : drillQueue.find((q) => !q.completed)?.tournament_players
  const player =
    assignment?.tournament_players ??
    queuePlayer ?? { name: drillPhase === 'queue' ? 'Cola' : '—', team_name: null as string | null }

  if (round && round.status === 'completed') {
    return (
      <div className="flex h-[100dvh] flex-col items-start overflow-y-auto bg-[#111111] px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
        <div className="my-auto w-full py-6 text-center">
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
          </div>
        ) : syncConfirmed ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#2E7D32]" />
              <span className="text-[12px] text-[#2E7D32]" style={latoFont}>
                ✓ Confirmado
              </span>
            </div>
            <Link
              href={`/dashboard/torneos/${tournamentId}`}
              className="text-[12px] text-[#666666] underline"
              style={latoFont}
            >
              Volver al torneo
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#2E7D32]" />
              <span className="text-[12px] text-[#2E7D32]" style={latoFont}>
                ✓ Todo sincronizado
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleConfirmSync()}
              disabled={confirming}
              className="mt-4 w-full bg-[#2E7D32] px-6 py-3 text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#FFFFFF] transition-colors hover:bg-[#1B5E20] active:scale-[0.97] disabled:opacity-50"
              style={{ fontFamily: "'Jost', sans-serif", borderRadius: 4 }}
            >
              {confirming ? 'CONFIRMANDO...' : '✓ CONFIRMAR SYNC COMPLETO'}
            </button>
          </div>
        )}
        </div>
      </div>
    )
  }

  if (round?.status === 'setup') {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#111111] px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
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
      className="fixed inset-0 z-[9999] select-none overflow-hidden bg-[#111111] px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Barra superior: jugador + timer + sync */}
      <div className="flex h-[52px] items-center justify-between px-1">
        <div className="flex items-center gap-2 overflow-hidden">
          {gameType && (
            <span
              className={`shrink-0 rounded px-[5px] py-[1px] text-[8px] font-extrabold uppercase tracking-[0.1em] ${
                gameType === 'speedsoft'
                  ? 'bg-[#0A2A4A] text-[#4FC3F7]'
                  : gameType === 'drills'
                    ? 'bg-[#1A2A1A] text-[#81C784]'
                    : 'bg-[#2A1A0A] text-[#FF9800]'
              }`}
              style={jostFont}
            >
              {gameType === 'speedsoft' ? 'SPD' : gameType === 'drills' ? 'DRILL' : 'TAC'}
            </span>
          )}
          {gameType === 'drills' && currentDrillIdx !== null && drillPhase === 'active' && (
            <span className="text-[9px] text-[#666666]" style={jostFont}>
              {currentDrillIdx + 1}/{drillQueue.length}
            </span>
          )}
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

        {/* Centro: timer + deshacer */}
        <div className="flex items-center gap-3">
          {gameType === 'drills' ? (
            <div className="text-center">
              <span className="font-mono text-[22px] font-bold tabular-nums leading-none text-[#FFFFFF]">
                {formatTimer(drillElapsed)}
              </span>
              {drillPenaltyTotal > 0 && (
                <span className="ml-1 text-[14px] font-bold tabular-nums text-[#CC4B37]">
                  +{drillPenaltyTotal}s
                </span>
              )}
            </div>
          ) : (
            <span
              className={`font-mono text-[22px] font-bold tabular-nums leading-none ${
                timeLeft !== null && timeLeft <= 30
                  ? 'text-[#CC4B37]'
                  : 'text-[#FFFFFF]'
              }`}
            >
              {timeLeft !== null ? formatTimer(timeLeft) : '--:--'}
            </span>
          )}
          <button
            type="button"
            onClick={undoLast}
            disabled={actions.length === 0 || buttonsDisabled}
            className="flex items-center gap-1 border border-[#444444] px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[#999999] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37] disabled:opacity-30"
            style={{ ...jostFont, borderRadius: 3 }}
          >
            ↩ DESHACER
          </button>
        </div>

        <div className="flex items-center gap-3">
          {gameType === 'drills' ? (
            <>
              <span className="font-mono text-[14px] font-bold tabular-nums text-[#CC4B37]">
                {counts.fouls}F
              </span>
              <span className="font-mono text-[14px] font-bold tabular-nums text-[#2E7D32]">
                {formatTimer(drillFinalTime)}
              </span>
            </>
          ) : (
            <>
              <span className="font-mono text-[14px] font-bold tabular-nums text-[#2E7D32]">
                {counts.kills}K
              </span>
              <span className="font-mono text-[14px] tabular-nums text-[#999999]">
                {counts.deaths}D
              </span>
            </>
          )}
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
      <div className="flex h-[calc(100dvh-52px-48px)] flex-col gap-[8px] px-[8px] pb-[4px]">
        {gameType === 'drills' ? (
          <>
            {drillPhase === 'queue' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
                <p style={jostFont} className="text-[12px] uppercase tracking-[0.15em] text-[#999999]">
                  SIGUIENTE JUGADOR
                </p>
                <div className="flex w-full max-w-[400px] flex-col gap-2">
                  {drillQueue.map((q, idx) => (
                    <button
                      key={q.id}
                      type="button"
                      disabled={q.completed}
                      onClick={() => void handleStartDrill(q, idx)}
                      className={`flex items-center justify-between border px-4 py-3 text-left transition-all active:scale-[0.97] ${
                        q.completed
                          ? 'border-[#2E7D32]/30 bg-[#1A2E1A] opacity-60'
                          : 'border-[#444444] bg-[#222222] hover:border-[#CC4B37]'
                      }`}
                      style={{ borderRadius: 4 }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] tabular-nums text-[#666666]" style={latoFont}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-[14px] font-semibold text-[#FFFFFF]" style={latoFont}>
                            {q.tournament_players.name}
                          </p>
                          {q.tournament_players.team_name && (
                            <p className="text-[11px] text-[#666666]" style={latoFont}>
                              {q.tournament_players.team_name}
                            </p>
                          )}
                        </div>
                      </div>
                      {q.completed ? (
                        <span className="text-[13px] font-bold text-[#2E7D32]" style={jostFont}>
                          ✓
                        </span>
                      ) : (
                        <span style={jostFont} className="text-[10px] uppercase tracking-[0.1em] text-[#CC4B37]">
                          INICIAR
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {drillQueue.length > 0 && (
                  <p className="text-[11px] text-[#666666]" style={latoFont}>
                    {drillQueue.filter((q) => q.completed).length} / {drillQueue.length} completados
                  </p>
                )}
              </div>
            ) : drillPhase === 'done' ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <p style={jostFont} className="text-[18px] uppercase tracking-[0.2em] text-[#2E7D32]">
                  TODOS COMPLETADOS
                </p>
                <p className="text-[13px] text-[#999999]" style={latoFont}>
                  {drillQueue.length} jugadores evaluados
                </p>
                {actions.some((a) => !a.synced) ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-[8px] w-[8px] animate-pulse rounded-full bg-[#F9A825]" />
                    <span className="text-[13px] text-[#F9A825]" style={latoFont}>
                      Sincronizando...
                    </span>
                  </div>
                ) : syncConfirmed ? (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#2E7D32]" />
                      <span className="text-[13px] text-[#2E7D32]" style={latoFont}>
                        ✓ Confirmado
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/torneos/${tournamentId}`}
                      className="text-[12px] text-[#666666] underline"
                      style={latoFont}
                    >
                      Volver al torneo
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleConfirmSync()}
                    disabled={confirming}
                    className="bg-[#2E7D32] px-6 py-3 text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#FFFFFF] active:scale-[0.97] disabled:opacity-50"
                    style={{ fontFamily: "'Jost', sans-serif", borderRadius: 4 }}
                  >
                    {confirming ? 'CONFIRMANDO...' : '✓ CONFIRMAR SYNC COMPLETO'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-1 gap-[6px]">
            <button
              type="button"
              disabled={buttonsDisabled}
              onClick={() => recordAction('foul')}
              className={`flex flex-1 flex-col items-center justify-center transition-all active:scale-[0.96] disabled:opacity-30 ${
                flash === 'foul' ? 'bg-[#FF1C1C]' : 'bg-[#CC4B37]'
              }`}
              style={{ ...jostFont, borderRadius: 4 }}
            >
              <span className="text-[28px] font-extrabold uppercase tracking-[0.1em] text-[#FFFFFF] sm:text-[36px]">
                FOUL
              </span>
              <span className="mt-1 text-[14px] font-bold tabular-nums text-[#FFFFFF]/70 sm:text-[16px]">
                +{round?.foul_penalty_seconds || 5}s
              </span>
              {counts.fouls > 0 && (
                <span className="mt-1 font-mono text-[18px] font-bold tabular-nums text-[#FFFFFF] sm:text-[22px]">
                  {counts.fouls}
                </span>
              )}
            </button>
            <button
              type="button"
              disabled={buttonsDisabled || counts.drill_completes >= 1}
              onClick={() => recordAction('drill_complete')}
              className={`flex flex-1 flex-col items-center justify-center transition-all active:scale-[0.96] disabled:opacity-30 ${
                counts.drill_completes >= 1
                  ? 'bg-[#1B5E20]'
                  : flash === 'drill_complete'
                    ? 'bg-[#4CAF50]'
                    : 'bg-[#2E7D32]'
              }`}
              style={{ ...jostFont, borderRadius: 4 }}
            >
              <span className="text-[24px] font-extrabold uppercase tracking-[0.1em] text-[#FFFFFF] sm:text-[32px]">
                {counts.drill_completes >= 1 ? '✓' : 'COMPLETADO'}
              </span>
              {counts.drill_completes >= 1 && (
                <span className="mt-1 text-[14px] font-bold text-[#FFFFFF]/70">
                  {formatTimer(drillFinalTime)}
                </span>
              )}
            </button>
              </div>
            )}
          </>
        ) : (
          <>
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
                <span className="flex flex-col items-center">
                  <span className="text-[28px] font-extrabold uppercase tracking-[0.1em] text-[#FFFFFF] sm:text-[36px]">
                    KILL
                  </span>
                  {counts.kills > 0 && (
                    <span className="mt-0.5 font-mono text-[20px] font-bold tabular-nums text-[#FFFFFF]/70 sm:text-[24px]">
                      {counts.kills}
                    </span>
                  )}
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
                <span className="flex flex-col items-center">
                  <span className="text-[28px] font-extrabold uppercase tracking-[0.1em] text-[#FFFFFF] sm:text-[36px]">
                    DEATH
                  </span>
                  {counts.deaths > 0 && (
                    <span className="mt-0.5 font-mono text-[20px] font-bold tabular-nums text-[#FFFFFF]/70 sm:text-[24px]">
                      {counts.deaths}
                    </span>
                  )}
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
                      ? 'border-[#F9A825] bg-[#2A1F00]'
                      : flash === 'first_kill'
                        ? 'border-[#333333] bg-[#333333]'
                        : 'border-[#333333] bg-[#1A1A1A]'
                }`}
                style={{ ...jostFont, borderRadius: 4 }}
              >
                <span
                  className={`text-center text-[10px] font-extrabold uppercase leading-tight tracking-[0.08em] sm:text-[12px] ${
                    firstKillUsed
                      ? 'text-[#2E7D32]'
                      : globalFirstKillTaken
                        ? 'text-[#F9A825]'
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
                      ✗ FIRST
                      <br />
                      <span className="text-[8px] normal-case">
                        {firstKillPlayerName ? `por ${firstKillPlayerName}` : 'ya tomado'}
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
              {secondaryButtons.map((btn) => (
                <button
                  key={btn.action}
                  type="button"
                  disabled={buttonsDisabled}
                  onClick={() => recordAction(btn.action)}
                  className={`flex flex-1 items-center justify-center border transition-all active:scale-[0.96] disabled:opacity-30 ${
                    btn.accent
                      ? flash === btn.action
                        ? 'border-[#FF1C1C] bg-[#331111]'
                        : 'border-[#CC4B37] bg-[#1A1A1A]'
                      : flash === btn.action
                        ? 'border-[#333333] bg-[#333333]'
                        : 'border-[#333333] bg-[#1A1A1A]'
                  }`}
                  style={{ ...jostFont, borderRadius: 4 }}
                >
                  <span
                    className={`flex flex-col items-center text-center text-[10px] font-extrabold uppercase leading-tight tracking-[0.08em] sm:text-[12px] ${
                      btn.accent ? 'text-[#CC4B37]' : 'text-[#FFFFFF]'
                    }`}
                  >
                    <span>
                      {btn.lines[0]}
                      {btn.lines[1] && (
                        <>
                          <br />
                          {btn.lines[1]}
                        </>
                      )}
                    </span>
                    {(() => {
                      const c = btn.action === 'objective' ? counts.objectives
                        : btn.action === 'key_action' ? counts.key_actions
                        : btn.action === 'critical_action' ? counts.critical_actions
                        : 0
                      return c > 0 ? (
                        <span className="mt-0.5 font-mono text-[12px] font-bold tabular-nums text-[#FFFFFF]/60 sm:text-[14px]">
                          {c}
                        </span>
                      ) : null
                    })()}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Barra inferior: estado */}
      <div className="flex h-[48px] items-center justify-end px-1">
        <div className="flex items-center gap-4">
          <span className="text-[10px] tabular-nums text-[#666666]" style={latoFont}>
            {gameType === 'drills' ? (
              `Fouls:${counts.fouls} (+${drillPenaltyTotal}s) · Tiempo:${formatTimer(drillElapsed)} · Final:${formatTimer(drillFinalTime)}`
            ) : gameType === 'speedsoft' ? (
              `FK:${counts.first_kills} CP:${counts.objectives}`
            ) : (
              `FK:${counts.first_kills} OBJ:${counts.objectives} PORT:${counts.key_actions} ACT:${counts.critical_actions}`
            )}
          </span>
          {pendingCount > 0 && (
            <span className="text-[10px] text-[#F9A825]" style={latoFont}>
              {pendingCount} pendientes
            </span>
          )}
        </div>
      </div>

      {/* Overlay drill completado */}
      {gameType === 'drills' && drillFinished && drillPhase === 'active' && (
        <div className="absolute inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-[#111111]/95 px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
          <div className="my-auto py-6 text-center">
            <p
              className="text-[20px] font-extrabold uppercase tracking-[0.3em] text-[#2E7D32]"
              style={jostFont}
            >
              CIRCUITO
            </p>
            <p
              className="mt-1 text-[20px] font-extrabold uppercase tracking-[0.3em] text-[#FFFFFF]"
              style={jostFont}
            >
              COMPLETADO
            </p>

            <p className="mt-6 font-mono text-[48px] font-bold tabular-nums text-[#2E7D32]">
              {formatTimer(drillFinalTime)}
            </p>

            <div className="mt-4 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-[24px] font-bold tabular-nums text-[#FFFFFF]">
                  {formatTimer(drillElapsed)}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[#666666]" style={jostFont}>
                  Tiempo
                </p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-bold tabular-nums text-[#CC4B37]">
                  {counts.fouls}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[#666666]" style={jostFont}>
                  Fouls
                </p>
              </div>
              <div className="text-center">
                <p className="text-[24px] font-bold tabular-nums text-[#CC4B37]">
                  +{drillPenaltyTotal}s
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[#666666]" style={jostFont}>
                  Penalización
                </p>
              </div>
            </div>

            {actions.some((a) => !a.synced) ? (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-[8px] w-[8px] animate-pulse rounded-full bg-[#F9A825]" />
                  <span className="text-[13px] font-semibold text-[#F9A825]" style={latoFont}>
                    Sincronizando {actions.filter((a) => !a.synced).length} acciones...
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[#666666]" style={latoFont}>
                  No cierres la app. Esperando conexión...
                </p>
              </div>
            ) : syncConfirmed ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#2E7D32]" />
                  <span className="text-[13px] font-semibold text-[#2E7D32]" style={latoFont}>
                    ✓ Confirmado
                  </span>
                </div>
                <Link
                  href={`/dashboard/torneos/${tournamentId}`}
                  className="text-[12px] text-[#666666] underline"
                  style={latoFont}
                >
                  Volver al torneo
                </Link>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#2E7D32]" />
                  <span className="text-[13px] font-semibold text-[#2E7D32]" style={latoFont}>
                    ✓ Todo sincronizado
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleConfirmSync()}
                  disabled={confirming}
                  className="mt-4 w-full bg-[#2E7D32] px-6 py-3 text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#FFFFFF] transition-colors hover:bg-[#1B5E20] active:scale-[0.97] disabled:opacity-50"
                  style={{ fontFamily: "'Jost', sans-serif", borderRadius: 4 }}
                >
                  {confirming ? 'CONFIRMANDO...' : '✓ CONFIRMAR SYNC COMPLETO'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay de tiempo agotado */}
      {gameType !== 'drills' && timeLeft !== null && timeLeft <= 0 && (
        <div className="absolute inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-[#111111]/95 px-4 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4">
          <div className="my-auto py-6 text-center">
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
            ) : syncConfirmed ? (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block h-[8px] w-[8px] rounded-full bg-[#2E7D32]" />
                  <span
                    className="text-[13px] font-semibold text-[#2E7D32]"
                    style={latoFont}
                  >
                    ✓ Confirmado — esperando cierre de ronda
                  </span>
                </div>
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
                <button
                  type="button"
                  onClick={() => void handleConfirmSync()}
                  disabled={confirming}
                  className="mt-4 w-full bg-[#2E7D32] px-6 py-3 text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#FFFFFF] transition-colors hover:bg-[#1B5E20] active:scale-[0.97] disabled:opacity-50"
                  style={{ fontFamily: "'Jost', sans-serif", borderRadius: 4 }}
                >
                  {confirming ? 'CONFIRMANDO...' : '✓ CONFIRMAR SYNC COMPLETO'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
