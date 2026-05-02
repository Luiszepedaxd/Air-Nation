'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { clearFeedSessionCache } from '@/app/dashboard/FeedHome'
import { supabase } from '@/lib/supabase'
import { unblockUser } from '@/lib/user-blocks'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type BlockedUser = {
  id: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
  blocked_at: string
}

export function BloqueadosSection({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [count, setCount] = useState<number | null>(null)

  // Carga inicial del count (no de los datos completos) para el badge
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { count: c } = await supabase
        .from('user_blocks')
        .select('*', { count: 'exact', head: true })
        .eq('blocker_id', userId)
      if (!cancelled) setCount(c ?? 0)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  // Carga la lista completa cuando se abre
  const loadList = async () => {
    setLoading(true)
    const { data: blocks } = await supabase
      .from('user_blocks')
      .select('blocked_id, created_at')
      .eq('blocker_id', userId)
      .order('created_at', { ascending: false })

    const blockedIds = (blocks ?? []).map(
      (b) => (b as { blocked_id: string }).blocked_id
    )

    if (blockedIds.length === 0) {
      setUsers([])
      setLoading(false)
      return
    }

    const { data: profiles } = await supabase
      .from('users')
      .select('id, alias, nombre, avatar_url')
      .in('id', blockedIds)

    const profileMap = new Map<string, { alias: string | null; nombre: string | null; avatar_url: string | null }>()
    for (const p of profiles ?? []) {
      const r = p as { id: string; alias: string | null; nombre: string | null; avatar_url: string | null }
      profileMap.set(r.id, { alias: r.alias, nombre: r.nombre, avatar_url: r.avatar_url })
    }

    const list: BlockedUser[] = (blocks ?? [])
      .map((b) => {
        const r = b as { blocked_id: string; created_at: string }
        const p = profileMap.get(r.blocked_id)
        if (!p) return null
        return {
          id: r.blocked_id,
          alias: p.alias,
          nombre: p.nombre,
          avatar_url: p.avatar_url,
          blocked_at: r.created_at,
        }
      })
      .filter((x): x is BlockedUser => x !== null)

    setUsers(list)
    setCount(list.length)
    setLoading(false)
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && users.length === 0) void loadList()
  }

  const handleUnblock = async (blockedId: string) => {
    setUnblockingId(blockedId)
    const result = await unblockUser(userId, blockedId)
    setUnblockingId(null)
    if (result.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== blockedId))
      setCount((c) => (c != null ? Math.max(0, c - 1) : null))
      setConfirmingId(null)
      // Invalidar cache del feed para que la próxima carga incluya
      // los posts del usuario que acabamos de desbloquear
      clearFeedSessionCache()
    }
  }

  return (
    <div className="border-t border-[#EEEEEE] pt-6">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between"
      >
        <div className="flex flex-col items-start">
          <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
            Usuarios bloqueados
          </p>
          <p style={lato} className="mt-0.5 text-[12px] text-[#666666]">
            {count === null
              ? 'Cargando…'
              : count === 0
              ? 'No has bloqueado a nadie'
              : count === 1
              ? '1 usuario bloqueado'
              : `${count} usuarios bloqueados`}
          </p>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="#666666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="mt-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-[#F4F4F4] animate-pulse" />
                  <div className="h-3 w-32 bg-[#F4F4F4] animate-pulse" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="border border-[#EEEEEE] bg-[#F9F9F9] px-4 py-6 text-center">
              <p style={lato} className="text-[13px] text-[#666666]">
                No tienes usuarios bloqueados.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#EEEEEE] border-y border-[#EEEEEE]">
              {users.map((u) => {
                const name = u.alias?.trim() || u.nombre?.trim() || 'Jugador'
                const isConfirming = confirmingId === u.id
                const isBusy = unblockingId === u.id
                return (
                  <li key={u.id} className="flex items-center gap-3 py-3">
                    <Link
                      href={`/u/${u.id}`}
                      className="flex flex-1 items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div
                            style={jost}
                            className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#CC4B37]"
                          >
                            {name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span
                        style={jost}
                        className="truncate text-[13px] font-extrabold uppercase text-[#111111]"
                      >
                        {name}
                      </span>
                    </Link>
                    {isConfirming ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => void handleUnblock(u.id)}
                          disabled={isBusy}
                          style={jost}
                          className="bg-[#CC4B37] px-3 py-1.5 text-[10px] font-extrabold uppercase text-white disabled:opacity-40"
                        >
                          {isBusy ? '…' : 'CONFIRMAR'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          disabled={isBusy}
                          style={jost}
                          className="border border-[#EEEEEE] px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#666666] disabled:opacity-40"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(u.id)}
                        style={jost}
                        className="shrink-0 border border-[#CCCCCC] bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#111111] hover:bg-[#F4F4F4] transition-colors"
                      >
                        DESBLOQUEAR
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
