'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import type { ApprovedFieldNotice } from '@/lib/approved-field-notices'
import type { PendingFieldOwnerRequest } from '@/lib/pending-field-owner-requests'
import type { JoinRequestRow } from '@/lib/pending-join-requests'
import { notifyPendingJoinUpdated } from '@/lib/pending-join-requests'
import { supabase } from '@/lib/supabase'
import {
  deleteNotif,
  fetchUserNotifs,
  markAllNotifsRead,
  type UserNotifRow,
} from '@/lib/user-notifications'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

async function sendPushNotif(
  recipientId: string,
  title: string,
  body: string,
  url: string
) {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    await fetch(`${API_URL}/push/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ recipientId, title, body, url }),
    })
  } catch { /* push es no-crítico */ }
}

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / (1000 * 60 * 60))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch { return '' }
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  } catch { return iso }
}

function notifText(n: UserNotifRow): string {
  const actor = n.actor.alias?.trim() || n.actor.nombre?.trim() || 'Alguien'
  switch (n.type) {
    case 'like_post': return `${actor} reaccionó a tu publicación`
    case 'comment_post': return `${actor} comentó tu publicación`
    case 'like_comment': return `${actor} reaccionó a tu comentario`
    default: return `${actor} interactuó contigo`
  }
}

// ─── SWIPEABLE ROW ───
function SwipeableRow({
  canDelete,
  onDelete,
  children,
}: {
  canDelete: boolean
  onDelete: () => void
  children: ReactNode
}) {
  const [offset, setOffset] = useState(0)
  const offsetRef = useRef(0)
  const startX = useRef<number | null>(null)
  const isDragging = useRef(false)
  const THRESHOLD = 60

  const handleTouchStart = (e: TouchEvent) => {
    if (!canDelete) return
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || startX.current === null) return
    const delta = e.touches[0].clientX - startX.current
    const next = Math.max(-100, Math.min(0, delta))
    offsetRef.current = next
    setOffset(next)
  }

  const handleTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    if (offsetRef.current < -THRESHOLD) {
      onDelete()
    } else {
      offsetRef.current = 0
      setOffset(0)
    }
    startX.current = null
  }

  return (
    <div className="relative overflow-hidden">
      {/* Fondo rojo de borrado */}
      {canDelete && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 px-5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      {/* Contenido deslizable */}
      <div
        style={{ transform: `translateX(${offset}px)`, transition: isDragging.current ? 'none' : 'transform 0.2s ease' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// ─── UNIFIED ITEM TYPES ───
type UnifiedItem =
  | { kind: 'notif'; data: UserNotifRow; created_at: string }
  | { kind: 'join_request'; data: JoinRequestRow; created_at: string; resolved: boolean }
  | { kind: 'field_request'; data: PendingFieldOwnerRequest; created_at: string; resolved: boolean }
  | { kind: 'approved_field'; data: ApprovedFieldNotice; created_at: string }

export function NotificacionesTab({
  userId,
  requests,
  approvedFieldNotices,
  ownerPendingFieldRequests,
  onRemove,
}: {
  userId: string
  requests: JoinRequestRow[]
  approvedFieldNotices: ApprovedFieldNotice[]
  ownerPendingFieldRequests: PendingFieldOwnerRequest[]
  onRemove: (id: string) => void
}) {
  const [notifs, setNotifs] = useState<UserNotifRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await fetchUserNotifs(supabase, userId, 50)
      if (!cancelled) {
        setNotifs(data)
        setLoading(false)
        await markAllNotifsRead(supabase, userId)
      }
    })()
    return () => { cancelled = true }
  }, [userId])

  const handleDeleteNotif = async (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
    await deleteNotif(supabase, id)
  }

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
      setResolvedIds(prev => {
        const next = new Set(prev)
        next.add(row.id)
        return next
      })
      notifyPendingJoinUpdated()
      void sendPushNotif(
        row.user_id,
        'Solicitud aprobada',
        `Tu solicitud para unirte a ${row.team_nombre} fue aprobada`,
        `/equipos/${encodeURIComponent(row.team_slug)}`
      )
    } finally { setBusyId(null) }
  }

  const handleReject = async (row: JoinRequestRow) => {
    setBusyId(row.id)
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .update({ status: 'rechazado' })
        .eq('id', row.id)
      if (error) throw error
      setResolvedIds(prev => {
        const next = new Set(prev)
        next.add(row.id)
        return next
      })
      notifyPendingJoinUpdated()
      void sendPushNotif(
        row.user_id,
        'Solicitud rechazada',
        `Tu solicitud para unirte a ${row.team_nombre} no fue aprobada`,
        '/dashboard/perfil?tab=notificaciones'
      )
    } finally { setBusyId(null) }
  }

  // Unificar todo en una lista cronológica
  const unified: UnifiedItem[] = [
    ...notifs.map(n => ({ kind: 'notif' as const, data: n, created_at: n.created_at })),
    ...requests.map(r => ({ kind: 'join_request' as const, data: r, created_at: r.created_at, resolved: resolvedIds.has(r.id) })),
    ...ownerPendingFieldRequests.map(r => ({ kind: 'field_request' as const, data: r, created_at: r.created_at, resolved: resolvedIds.has(r.id) })),
    ...approvedFieldNotices.map(n => ({ kind: 'approved_field' as const, data: n, created_at: n.updated_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (loading) return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map(i => (
        <div key={i} className="flex gap-3 border border-[#EEEEEE] p-3 animate-pulse">
          <div className="h-9 w-9 shrink-0 rounded-full bg-[#F4F4F4]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 bg-[#F4F4F4]" />
            <div className="h-2 w-1/4 bg-[#F4F4F4]" />
          </div>
        </div>
      ))}
    </div>
  )

  if (unified.length === 0) return (
    <p className="py-8 text-center text-[13px] text-[#999999]" style={lato}>
      No tienes notificaciones aún
    </p>
  )

  return (
    <div className="flex flex-col gap-2 pb-10">
      {unified.map(item => {
        // ─── NOTIF DE ACTIVIDAD ───
        if (item.kind === 'notif') {
          const n = item.data
          const name = n.actor.alias?.trim() || n.actor.nombre?.trim() || '?'
          return (
            <SwipeableRow key={`notif-${n.id}`} canDelete onDelete={() => void handleDeleteNotif(n.id)}>
              <div className={`flex items-center gap-3 border px-3 py-3 ${!n.read ? 'border-[#CC4B37]/20 bg-[#FFF8F7]' : 'border-[#EEEEEE] bg-[#FFFFFF]'}`}>
                <Link href={n.href ?? '/dashboard'} className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                    {n.actor.avatar_url ? (
                      <img src={n.actor.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#CC4B37]" style={jost}>
                        {name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#111111]" style={lato}>{notifText(n)}</p>
                    <p className="mt-0.5 text-[11px] text-[#999999]" style={lato}>{timeAgo(n.created_at)}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDeleteNotif(n.id)}
                  className="shrink-0 p-2 text-[#CCCCCC] hover:text-[#CC4B37] transition-colors"
                  aria-label="Borrar notificación"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {!n.read && <div className="h-2 w-2 shrink-0 rounded-full bg-[#CC4B37]" />}
              </div>
            </SwipeableRow>
          )
        }

        // ─── SOLICITUD DE MEMBRESÍA ───
        if (item.kind === 'join_request') {
          const row = item.data
          const name = row.solicitante_nombre?.trim() || row.solicitante_alias?.trim() || 'Usuario'
          const alias = row.solicitante_alias?.trim()
          const busy = busyId === row.id
          const resolved = item.resolved
          return (
            <SwipeableRow
              key={`join-${row.id}`}
              canDelete={resolved}
              onDelete={() => onRemove(row.id)}
            >
              <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden bg-[#F4F4F4]">
                    {row.solicitante_avatar ? (
                      <img src={row.solicitante_avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[14px] text-[#CC4B37]" style={jost}>
                        {(row.solicitante_alias?.[0] || row.solicitante_nombre?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#111111]" style={lato}>
                      <span className="font-semibold">{name}</span>
                      {alias ? <span className="text-[#666666]"> · @{alias}</span> : null}
                      {' '}quiere unirse a <span className="font-semibold">{row.team_nombre}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-[#999999]" style={lato}>{timeAgo(row.created_at)}</p>
                  </div>
                  {resolved && (
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="shrink-0 p-2 text-[#CCCCCC] hover:text-[#CC4B37] transition-colors"
                      aria-label="Borrar"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
                {!resolved && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleApprove(row)}
                      style={jost}
                      className="flex-1 bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-white disabled:opacity-50"
                    >
                      APROBAR
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleReject(row)}
                      style={jost}
                      className="flex-1 border border-[#EEEEEE] px-4 py-2 text-[11px] font-extrabold uppercase text-[#666666] disabled:opacity-50"
                    >
                      RECHAZAR
                    </button>
                  </div>
                )}
                {resolved && (
                  <p className="mt-2 text-[11px] text-[#999999]" style={lato}>
                    Solicitud procesada · desliza para borrar
                  </p>
                )}
              </div>
            </SwipeableRow>
          )
        }

        // ─── SOLICITUD EN TU CAMPO ───
        if (item.kind === 'field_request') {
          const row = item.data
          const resolved = item.resolved
          const fechaTxt = formatDateOnly(row.fecha_deseada)
          const num = row.num_jugadores
          return (
            <SwipeableRow
              key={`fr-${row.id}`}
              canDelete={resolved}
              onDelete={() => onRemove(row.id)}
            >
              <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-[13px] text-[#111111]" style={lato}>
                      <span className="font-semibold">{row.solicitante_nombre?.trim() || row.solicitante_alias?.trim() || 'Un jugador'}</span>
                      {' '}quiere usar <span className="font-semibold">{row.field_nombre}</span>
                    </p>
                    <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                      {fechaTxt ? <>Fecha: <span className="font-semibold text-[#111111]">{fechaTxt}</span></> : 'Fecha: —'}
                      {num != null ? <> · {num} {num === 1 ? 'jugador' : 'jugadores'}</> : null}
                    </p>
                    <p className="mt-1 text-[11px] text-[#999999]" style={lato}>{timeAgo(row.created_at)}</p>
                  </div>
                  {resolved && (
                    <button
                      type="button"
                      onClick={() => onRemove(row.id)}
                      className="shrink-0 p-2 text-[#CCCCCC] hover:text-[#CC4B37] transition-colors"
                      aria-label="Borrar"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
                {!resolved && (
                  <Link
                    href={`/mi-campo/${encodeURIComponent(row.field_id)}`}
                    style={jost}
                    className="mt-3 inline-flex w-full items-center justify-center bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-white"
                  >
                    VER SOLICITUD
                  </Link>
                )}
                {resolved && (
                  <p className="mt-2 text-[11px] text-[#999999]" style={lato}>
                    Solicitud procesada · desliza para borrar
                  </p>
                )}
              </div>
            </SwipeableRow>
          )
        }

        // ─── CAMPO APROBADO ───
        if (item.kind === 'approved_field') {
          const n = item.data
          const fechaTxt = formatDateOnly(n.fecha_deseada)
          return (
            <SwipeableRow key={`af-${n.id}`} canDelete onDelete={() => onRemove(n.id)}>
              <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-[13px] text-[#111111]" style={lato}>
                      Tu solicitud para <span className="font-semibold">{n.field_nombre}</span>
                      {fechaTxt ? <> el {fechaTxt}</> : null} fue aprobada
                    </p>
                    <p className="mt-1 text-[11px] text-[#999999]" style={lato}>{timeAgo(n.updated_at)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(n.id)}
                    className="shrink-0 p-2 text-[#CCCCCC] hover:text-[#CC4B37] transition-colors"
                    aria-label="Borrar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <Link
                  href={`/eventos/${encodeURIComponent(n.event_id)}`}
                  style={jost}
                  className="mt-3 inline-flex w-full items-center justify-center bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-white"
                >
                  VER EVENTO
                </Link>
              </div>
            </SwipeableRow>
          )
        }

        return null
      })}
    </div>
  )
}
