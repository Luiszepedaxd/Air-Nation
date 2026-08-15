'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const latoBody = { fontFamily: "'Lato', sans-serif" } as const

type TournamentAdmin = {
  id: string
  name: string
  game_type: 'speedsoft' | 'tactical_arena'
  status: string
  default_round_duration_seconds: number
  created_at: string
  users?: { nombre?: string; alias?: string; email?: string } | null
  tournament_rounds?: { count: number }[]
  tournament_players?: { count: number }[]
  tournament_referees?: { count: number }[]
}

function getCount(arr?: { count: number }[]): number {
  if (!arr || arr.length === 0) return 0
  return arr[0]?.count ?? 0
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))
  } catch { return '' }
}

function creatorName(t: TournamentAdmin): string {
  const u = Array.isArray(t.users) ? t.users[0] : t.users
  if (!u) return '—'
  return u.nombre || u.alias || u.email || '—'
}

export function AdminTorneosClient() {
  const [tournaments, setTournaments] = useState<TournamentAdmin[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/tournaments/admin/all')
      if (res.ok) setTournaments(await res.json())
    } catch { /* silenciar */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleExport = async (id: string, name: string) => {
    try {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession()
      const token = session?.access_token
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

      const res = await fetch(`${API_BASE}/api/v1/tournaments/admin/${id}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Error al exportar')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}_scoreboard.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch { /* silenciar */ }
  }

  return (
    <div style={latoBody}>
      <h1 className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl" style={jostHeading}>
        TORNEOS
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(k => (
            <div key={k} className="h-20 animate-pulse border border-[#EEEEEE] bg-[#F4F4F4]" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <p className="text-[13px] text-[#666666]" style={latoBody}>No hay torneos en el sistema.</p>
      ) : (
        <div className="border border-[#EEEEEE]">
          {/* Header */}
          <div className="hidden grid-cols-12 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2 md:grid">
            <span style={jostHeading} className="col-span-3 text-[9px] tracking-widest text-[#999999]">NOMBRE</span>
            <span style={jostHeading} className="col-span-2 text-[9px] tracking-widest text-[#999999]">CREADOR</span>
            <span style={jostHeading} className="col-span-1 text-[9px] tracking-widest text-[#999999]">TIPO</span>
            <span style={jostHeading} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">STATUS</span>
            <span style={jostHeading} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">RONDAS</span>
            <span style={jostHeading} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">JUGADORES</span>
            <span style={jostHeading} className="col-span-1 text-center text-[9px] tracking-widest text-[#999999]">ÁRBITROS</span>
            <span style={jostHeading} className="col-span-2 text-right text-[9px] tracking-widest text-[#999999]">ACCIONES</span>
          </div>

          {tournaments.map(t => (
            <div key={t.id} className="grid grid-cols-1 items-center border-b border-[#F4F4F4] px-4 py-3 last:border-0 hover:bg-[#FAFAFA] md:grid-cols-12">
              {/* Mobile: stacked */}
              <div className="col-span-3 min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#111111]" style={latoBody}>
                  {t.name}
                </p>
                <p className="text-[11px] text-[#999999]" style={latoBody}>{formatDate(t.created_at)}</p>
              </div>
              <div className="col-span-2 hidden min-w-0 md:block">
                <p className="truncate text-[12px] text-[#666666]" style={latoBody}>{creatorName(t)}</p>
              </div>
              <div className="col-span-1 hidden md:block">
                <span style={jostHeading} className="inline-block border border-[#EEEEEE] px-1.5 py-0.5 text-[9px] text-[#444444]">
                  {t.game_type === 'speedsoft' ? 'SPEED' : 'TACTICAL'}
                </span>
              </div>
              <div className="col-span-1 hidden text-center md:block">
                <span
                  style={jostHeading}
                  className={`inline-block px-1.5 py-0.5 text-[9px] ${
                    t.status === 'active' ? 'bg-[#2E7D32] text-[#FFFFFF]'
                    : t.status === 'completed' ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'bg-[#F4F4F4] text-[#666666]'
                  }`}
                >
                  {t.status === 'active' ? 'LIVE' : t.status === 'completed' ? 'DONE' : 'SETUP'}
                </span>
              </div>
              <p className="col-span-1 hidden text-center text-[13px] tabular-nums text-[#111111] md:block" style={latoBody}>
                {getCount(t.tournament_rounds)}
              </p>
              <p className="col-span-1 hidden text-center text-[13px] tabular-nums text-[#111111] md:block" style={latoBody}>
                {getCount(t.tournament_players)}
              </p>
              <p className="col-span-1 hidden text-center text-[13px] tabular-nums text-[#111111] md:block" style={latoBody}>
                {getCount(t.tournament_referees)}
              </p>
              <div className="col-span-2 mt-2 flex items-center justify-end gap-2 md:mt-0">
                <Link
                  href={`/admin/torneos/${t.id}`}
                  style={jostHeading}
                  className="inline-flex bg-[#111111] px-3 py-1.5 text-[9px] tracking-[0.1em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                >
                  VER
                </Link>
                <button
                  type="button"
                  onClick={() => void handleExport(t.id, t.name)}
                  style={jostHeading}
                  className="inline-flex border border-[#EEEEEE] bg-[#FFFFFF] px-3 py-1.5 text-[9px] tracking-[0.1em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
                >
                  📥 EXCEL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
