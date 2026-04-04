'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { JoinRequestRow } from '@/lib/pending-join-requests'
import { notifyPendingJoinUpdated } from '@/lib/pending-join-requests'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function relativeTime(iso: string): string {
  try {
    const t = new Date(iso).getTime()
    const diff = Date.now() - t
    const h = Math.floor(diff / (60 * 60 * 1000))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch {
    return ''
  }
}

function initialFromName(row: JoinRequestRow) {
  const s =
    row.solicitante_alias?.trim()?.[0] ||
    row.solicitante_nombre?.trim()?.[0] ||
    '?'
  return s.toUpperCase()
}

export function NotificacionesTab({
  requests,
  onRemove,
}: {
  requests: JoinRequestRow[]
  onRemove: (id: string) => void
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleApprove = async (row: JoinRequestRow) => {
    setBusyId(row.id)
    try {
      const { error: uErr } = await supabase
        .from('team_join_requests')
        .update({ status: 'aprobado' })
        .eq('id', row.id)

      if (uErr) throw uErr

      const { error: iErr } = await supabase.from('team_members').insert({
        team_id: row.team_id,
        user_id: row.user_id,
        rol_plataforma: 'member',
        rango_militar: 'miembro',
        status: 'activo',
      })

      if (iErr) throw iErr

      onRemove(row.id)
      notifyPendingJoinUpdated()
    } catch {
      // revert optimistic: refetch could go here
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (row: JoinRequestRow) => {
    setBusyId(row.id)
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .update({ status: 'rechazado' })
        .eq('id', row.id)

      if (error) throw error

      onRemove(row.id)
      notifyPendingJoinUpdated()
    } catch {
      /* keep row */
    } finally {
      setBusyId(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p style={jost} className="text-[14px] font-extrabold uppercase text-[#666666]">
          Todo al día
        </p>
        <p className="mt-2 text-[13px] text-[#999999]" style={lato}>
          No tienes solicitudes pendientes
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4 pb-10">
      {requests.map((row) => {
        const name =
          row.solicitante_nombre?.trim() ||
          row.solicitante_alias?.trim() ||
          'Usuario'
        const alias = row.solicitante_alias?.trim()
        const busy = busyId === row.id
        return (
          <li
            key={row.id}
            className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
                {row.solicitante_avatar ? (
                  <img
                    src={row.solicitante_avatar}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[16px] text-[#CC4B37]"
                    style={jost}
                  >
                    {initialFromName(row)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#111111]" style={lato}>
                  <span className="font-semibold">{name}</span>
                  {alias ? (
                    <span className="text-[#666666]"> · @{alias}</span>
                  ) : null}
                </p>
                <p className="mt-1 text-[13px] text-[#111111]" style={lato}>
                  Quiere unirse a{' '}
                  <span className="font-semibold">{row.team_nombre}</span>
                </p>
                <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                  {relativeTime(row.created_at)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleApprove(row)}
                style={jost}
                className="min-h-[40px] min-w-[120px] flex-1 rounded-[2px] bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-[#FFFFFF] transition-opacity disabled:opacity-50 sm:flex-none"
              >
                APROBAR
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleReject(row)}
                style={jost}
                className="min-h-[40px] min-w-[120px] flex-1 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2 text-[11px] font-extrabold uppercase text-[#666666] transition-opacity disabled:opacity-50 sm:flex-none"
              >
                RECHAZAR
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
