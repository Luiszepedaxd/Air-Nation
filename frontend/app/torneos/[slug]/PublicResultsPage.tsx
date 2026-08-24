'use client'

import { useCallback, useEffect, useState } from 'react'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type ScoreEntry = {
  player_id: string; name: string; team_name: string | null
  kills: number; deaths: number; first_kills: number; objectives: number
  key_actions: number; critical_actions: number; kd: number
  performance_score: number; impact_score: number; total_score: number
}

type RoundScoreboard = {
  round_id: string; round_number: number; name: string | null
  status?: string
  voided_reason?: string | null
  scoreboard: ScoreEntry[]
}

type PublicData = {
  tournament: {
    name: string; game_type: string; status: string
    finalized_at: string | null; created_at: string
  }
  creator_name: string | null
  total_players: number
  total_rounds: number
  general_scoreboard: ScoreEntry[]
  round_scoreboards: RoundScoreboard[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function TrophyIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M8 2h8v1H8V2Z" fill="#CC4B37" />
      <path d="M6 3h12v2.5c0 3.59-2.69 6.5-6 6.5S6 9.09 6 5.5V3Z" stroke="#111111" strokeWidth="1.5" />
      <path d="M6 5H4a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3h1" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 5h2a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3h-1" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 12v3" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 21h8" stroke="#CC4B37" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 15h4l1 6H9l1-6Z" stroke="#111111" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date(iso))
  } catch { return '' }
}

export function PublicResultsPage({ slug }: { slug: string }) {
  const [data, setData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/tournaments/public/${slug}`)
      if (!res.ok) throw new Error('Torneo no encontrado')
      setData(await res.json())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FFFFFF]">
        <div className="mx-auto max-w-[800px] px-4 py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-48 animate-pulse bg-[#F4F4F4]" />
            <div className="h-4 w-32 animate-pulse bg-[#F4F4F4]" />
            <div className="mt-8 h-64 w-full animate-pulse bg-[#F4F4F4]" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] bg-[#FFFFFF]">
        <div className="mx-auto flex min-h-[60vh] max-w-[800px] flex-col items-center justify-center px-6">
          <TrophyIcon size={48} />
          <p className="mt-4 text-[15px] text-[#CC4B37]" style={lato}>{error || 'Torneo no encontrado'}</p>
          <p className="mt-2 text-[13px] text-[#999999]" style={lato}>
            Este torneo no existe o sus resultados no están publicados.
          </p>
          <a href="https://www.airnation.online" className="mt-6 text-[12px] text-[#CC4B37] underline" style={lato}>
            airnation.online
          </a>
        </div>
      </div>
    )
  }

  const { tournament, general_scoreboard, round_scoreboards } = data
  const top3 = general_scoreboard.slice(0, 3)
  const selectedScoreboard = selectedRound
    ? round_scoreboards.find(r => r.round_id === selectedRound)?.scoreboard || []
    : general_scoreboard

  return (
    <div className="min-h-[100dvh] bg-[#FFFFFF]">
      <div className="mx-auto max-w-[800px] px-4 py-8 pb-16 md:px-6">
      {/* ── Header ──────────────────────────────── */}
      <div className="border-b border-[#EEEEEE] pb-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <TrophyIcon size={28} />
          <span style={jost} className="text-[10px] tracking-[0.2em] text-[#CC4B37]">
            RESULTADOS OFICIALES
          </span>
          <TrophyIcon size={28} />
        </div>
        <h1
          className="mt-4 text-[26px] text-[#111111] md:text-[32px]"
          style={{ fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'none' }}
        >
          {tournament.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <span style={jost} className="border border-[#111111] px-3 py-1 text-[10px] tracking-[0.12em] text-[#111111]">
            {tournament.game_type === 'speedsoft' ? 'SPEEDSOFT' : 'TACTICAL ARENA'}
          </span>
        </div>
        <p className="mt-3 text-[13px] text-[#999999]" style={lato}>
          {data.total_players} jugadores · {data.total_rounds} rondas
          {data.creator_name ? ` · Organizado por ${data.creator_name}` : ''}
        </p>
        {tournament.finalized_at && (
          <p className="mt-1 text-[11px] text-[#CCCCCC]" style={lato}>
            {formatDate(tournament.finalized_at)}
          </p>
        )}
      </div>

      {/* ── Podio Top 3 ─────────────────────────── */}
      {top3.length >= 3 && (
        <div className="border-b border-[#EEEEEE] py-8">
          <p style={jost} className="mb-6 text-center text-[10px] tracking-[0.2em] text-[#999999]">
            PODIO
          </p>
          <div className="flex items-end justify-center gap-2 md:gap-4">
            {/* 2do lugar */}
            <div className="flex w-[100px] flex-col items-center md:w-[140px]">
              <div className="flex w-full flex-col items-center border border-[#EEEEEE] bg-[#FAFAFA] px-2 py-4">
                <span style={jost} className="text-[24px] text-[#999999]">2</span>
                <p className="mt-2 text-center text-[12px] font-semibold text-[#111111] md:text-[13px]" style={lato}>
                  {top3[1].name}
                </p>
                {top3[1].team_name && (
                  <p className="mt-0.5 text-[10px] text-[#999999]" style={lato}>{top3[1].team_name}</p>
                )}
                <p className="mt-2 text-[18px] font-bold tabular-nums text-[#666666]" style={lato}>
                  {top3[1].total_score}
                </p>
              </div>
            </div>

            {/* 1er lugar */}
            <div className="flex w-[110px] flex-col items-center md:w-[160px]">
              <div className="flex w-full flex-col items-center border-2 border-[#CC4B37] bg-[#FFFFFF] px-2 py-5">
                <TrophyIcon size={24} />
                <span style={jost} className="mt-1 text-[28px] text-[#CC4B37]">1</span>
                <p className="mt-2 text-center text-[13px] font-bold text-[#111111] md:text-[15px]" style={lato}>
                  {top3[0].name}
                </p>
                {top3[0].team_name && (
                  <p className="mt-0.5 text-[11px] text-[#CC4B37]" style={lato}>{top3[0].team_name}</p>
                )}
                <p className="mt-2 text-[22px] font-bold tabular-nums text-[#CC4B37]" style={lato}>
                  {top3[0].total_score}
                </p>
              </div>
            </div>

            {/* 3er lugar */}
            <div className="flex w-[90px] flex-col items-center md:w-[120px]">
              <div className="flex w-full flex-col items-center border border-[#EEEEEE] bg-[#FAFAFA] px-2 py-3">
                <span style={jost} className="text-[20px] text-[#999999]">3</span>
                <p className="mt-2 text-center text-[11px] font-semibold text-[#111111] md:text-[12px]" style={lato}>
                  {top3[2].name}
                </p>
                {top3[2].team_name && (
                  <p className="mt-0.5 text-[9px] text-[#999999]" style={lato}>{top3[2].team_name}</p>
                )}
                <p className="mt-2 text-[16px] font-bold tabular-nums text-[#666666]" style={lato}>
                  {top3[2].total_score}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Selector de ronda ───────────────────── */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedRound(null)}
            style={jost}
            className={`border px-4 py-2 text-[10px] tracking-[0.12em] transition-colors ${
              !selectedRound
                ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                : 'border-[#EEEEEE] text-[#666666] hover:border-[#111111]'
            }`}
          >
            GENERAL
          </button>
          {round_scoreboards.map(r => {
            const isVoided = r.status === 'voided'
            return (
              <button
                key={r.round_id}
                type="button"
                onClick={() => setSelectedRound(r.round_id)}
                style={jost}
                className={`border px-4 py-2 text-[10px] tracking-[0.12em] transition-colors ${
                  isVoided
                    ? selectedRound === r.round_id
                      ? 'border-[#CC4B37] bg-[#CC4B37]/10 text-[#CC4B37]'
                      : 'border-[#EEEEEE] text-[#CC4B37]/50'
                    : selectedRound === r.round_id
                      ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                      : 'border-[#EEEEEE] text-[#666666] hover:border-[#111111]'
                }`}
              >
                {r.name || `RONDA ${r.round_number}`}
                {isVoided && ' (ANULADA)'}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tabla de resultados ─────────────────── */}
      {(() => {
        if (!selectedRound) return null
        const round = round_scoreboards.find(r => r.round_id === selectedRound)
        if (!round || round.status !== 'voided') return null
        return (
          <div className="mt-4 border border-[#CC4B37]/30 bg-[#CC4B37]/5 px-4 py-3">
            <p style={jost} className="text-[10px] tracking-[0.12em] text-[#CC4B37]">
              RONDA ANULADA — RESULTADOS NO INCLUIDOS EN EL RANKING GENERAL
            </p>
            {round.voided_reason && (
              <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                Motivo: {round.voided_reason}
              </p>
            )}
          </div>
        )
      })()}
      <div className="mt-4 border border-[#EEEEEE]">
        {/* Header */}
        <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#FAFAFA] px-3 py-2.5 md:px-4">
          <span style={jost} className="col-span-1 text-[9px] tracking-widest text-[#999999]">#</span>
          <span style={jost} className="col-span-3 text-[9px] tracking-widest text-[#999999]">JUGADOR</span>
          <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">K</span>
          <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">D</span>
          <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">K/D</span>
          <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">FK</span>
          <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">OBJ</span>
          <span style={jost} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">KA+CA</span>
          <span style={jost} className="col-span-2 text-right text-[9px] tracking-widest text-[#CC4B37]">SCORE</span>
        </div>

        {/* Rows */}
        {selectedScoreboard.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-[#999999]" style={lato}>Sin datos para esta ronda</p>
          </div>
        ) : selectedScoreboard.map((s, i) => (
          <div
            key={s.player_id}
            className={`grid grid-cols-12 items-center px-3 py-3 transition-colors hover:bg-[#FAFAFA] md:px-4 ${
              i < selectedScoreboard.length - 1 ? 'border-b border-[#F4F4F4]' : ''
            } ${i < 3 ? 'bg-[#FAFAFA]/50' : ''}`}
          >
            <span className={`col-span-1 text-[13px] font-bold tabular-nums ${
              i === 0 ? 'text-[#CC4B37]' : 'text-[#CCCCCC]'
            }`} style={lato}>
              {i + 1}
            </span>
            <div className="col-span-3 min-w-0">
              <p className={`truncate text-[13px] ${i === 0 ? 'font-bold text-[#111111]' : 'font-semibold text-[#111111]'}`} style={lato}>
                {s.name}
              </p>
              {s.team_name && (
                <p className="truncate text-[10px] text-[#999999]" style={lato}>{s.team_name}</p>
              )}
            </div>
            <span className="col-span-1 text-center text-[13px] font-bold tabular-nums text-[#111111]" style={lato}>{s.kills}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#999999]" style={lato}>{s.deaths}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#999999]" style={lato}>{s.kd}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>{s.first_kills}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>{s.objectives}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>{s.key_actions + s.critical_actions}</span>
            <span className={`col-span-2 text-right tabular-nums font-bold ${
              i === 0 ? 'text-[18px] text-[#CC4B37]' : 'text-[15px] text-[#CC4B37]'
            }`} style={lato}>
              {s.total_score}
            </span>
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────── */}
      <div className="mt-10 border-t border-[#EEEEEE] pt-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <TrophyIcon size={16} />
          <span style={jost} className="text-[9px] tracking-[0.2em] text-[#CCCCCC]">
            POWERED BY AIRNATION
          </span>
        </div>
        <a
          href="https://www.airnation.online"
          className="mt-2 inline-block text-[12px] text-[#CC4B37] transition-colors hover:text-[#111111]"
          style={lato}
        >
          airnation.online
        </a>
      </div>
      </div>
    </div>
  )
}
