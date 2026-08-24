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

export function PublicResultsPage({ slug }: { slug: string }) {
  const [data, setData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/tournaments/public/${slug}`)
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[14px] text-[#999999]" style={lato}>Cargando resultados...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <p className="text-[16px] text-[#CC4B37]" style={lato}>{error || 'Torneo no encontrado'}</p>
        <p className="mt-2 text-[13px] text-[#999999]" style={lato}>
          Este torneo no existe o sus resultados no están publicados.
        </p>
      </div>
    )
  }

  const { tournament, general_scoreboard, round_scoreboards } = data
  const top3 = general_scoreboard.slice(0, 3)
  const selectedScoreboard = selectedRound
    ? round_scoreboards.find(r => r.round_id === selectedRound)?.scoreboard || []
    : general_scoreboard

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 pb-16 md:px-6">
      <div className="text-center">
        <span className="text-[40px]">🏆</span>
        <h1 className="mt-3 text-[28px] text-[#111111] md:text-[36px]" style={{ ...jost, textTransform: 'none' }}>
          {tournament.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <span style={jost} className="inline-block border border-[#EEEEEE] px-3 py-1 text-[11px] tracking-wide text-[#444444]">
            {tournament.game_type === 'speedsoft' ? 'SPEEDSOFT' : 'TACTICAL ARENA'}
          </span>
          <span className="text-[13px] text-[#999999]" style={lato}>
            {data.total_players} jugadores · {data.total_rounds} rondas
          </span>
          {data.creator_name && (
            <span className="text-[13px] text-[#999999]" style={lato}>
              Organizado por {data.creator_name}
            </span>
          )}
        </div>
      </div>

      {top3.length >= 3 && (
        <div className="mt-10 flex items-end justify-center gap-3 md:gap-6">
          <div className="flex flex-col items-center">
            <div className="flex h-[100px] w-[90px] flex-col items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] md:h-[120px] md:w-[120px]">
              <span className="text-[24px]">🥈</span>
              <p className="mt-1 text-center text-[12px] font-semibold text-[#111111] md:text-[13px]" style={lato}>
                {top3[1].name}
              </p>
              {top3[1].team_name && (
                <p className="text-[10px] text-[#999999]" style={lato}>{top3[1].team_name}</p>
              )}
            </div>
            <p className="mt-2 text-[16px] font-bold tabular-nums text-[#666666]" style={lato}>{top3[1].total_score}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-[130px] w-[100px] flex-col items-center justify-center border-2 border-[#CC4B37] bg-[#CC4B37]/5 md:h-[150px] md:w-[140px]">
              <span className="text-[32px]">🥇</span>
              <p className="mt-1 text-center text-[13px] font-bold text-[#111111] md:text-[15px]" style={lato}>
                {top3[0].name}
              </p>
              {top3[0].team_name && (
                <p className="text-[10px] text-[#CC4B37]" style={lato}>{top3[0].team_name}</p>
              )}
            </div>
            <p className="mt-2 text-[20px] font-bold tabular-nums text-[#CC4B37]" style={lato}>{top3[0].total_score}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-[80px] w-[85px] flex-col items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] md:h-[100px] md:w-[110px]">
              <span className="text-[20px]">🥉</span>
              <p className="mt-1 text-center text-[11px] font-semibold text-[#111111] md:text-[12px]" style={lato}>
                {top3[2].name}
              </p>
              {top3[2].team_name && (
                <p className="text-[9px] text-[#999999]" style={lato}>{top3[2].team_name}</p>
              )}
            </div>
            <p className="mt-2 text-[14px] font-bold tabular-nums text-[#666666]" style={lato}>{top3[2].total_score}</p>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedRound(null)}
          style={jost}
          className={`border px-4 py-2 text-[10px] tracking-[0.12em] transition-colors ${
            !selectedRound
              ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
              : 'border-[#EEEEEE] text-[#666666] hover:border-[#CC4B37]'
          }`}
        >
          GENERAL
        </button>
        {round_scoreboards.map(r => (
          <button
            key={r.round_id}
            type="button"
            onClick={() => setSelectedRound(r.round_id)}
            style={jost}
            className={`border px-4 py-2 text-[10px] tracking-[0.12em] transition-colors ${
              selectedRound === r.round_id
                ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                : 'border-[#EEEEEE] text-[#666666] hover:border-[#CC4B37]'
            }`}
          >
            {r.name || `Ronda ${r.round_number}`}
          </button>
        ))}
      </div>

      <div className="mt-4 border border-[#EEEEEE]">
        <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2">
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
        {selectedScoreboard.map((s, i) => (
          <div key={s.player_id} className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-[#FAFAFA] ${i < selectedScoreboard.length - 1 ? 'border-b border-[#F4F4F4]' : ''}`}>
            <span className="col-span-1 text-[13px] font-bold tabular-nums text-[#999999]" style={lato}>
              {i + 1}
            </span>
            <div className="col-span-3 min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#111111]" style={lato}>{s.name}</p>
              {s.team_name && <p className="truncate text-[10px] text-[#999999]" style={lato}>{s.team_name}</p>}
            </div>
            <span className="col-span-1 text-center text-[13px] font-bold tabular-nums text-[#111111]" style={lato}>{s.kills}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#666666]" style={lato}>{s.deaths}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#666666]" style={lato}>{s.kd}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>{s.first_kills}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>{s.objectives}</span>
            <span className="col-span-1 text-center text-[13px] tabular-nums text-[#111111]" style={lato}>{s.key_actions + s.critical_actions}</span>
            <span className="col-span-2 text-right text-[16px] font-bold tabular-nums text-[#CC4B37]" style={lato}>{s.total_score}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[11px] text-[#999999]" style={lato}>
          Resultados oficiales · Powered by AirNation
        </p>
        <a href="https://www.airnation.online" className="mt-1 inline-block text-[11px] text-[#CC4B37]" style={lato}>
          airnation.online
        </a>
      </div>
    </div>
  )
}
