'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ApprovedFieldNotice } from '@/lib/approved-field-notices'
import type { PendingFieldOwnerRequest } from '@/lib/pending-field-owner-requests'
import type { JoinRequestRow } from '@/lib/pending-join-requests'
import { notifyPendingJoinUpdated } from '@/lib/pending-join-requests'
import { supabase } from '@/lib/supabase'
import {
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
  } catch {
    // push es no-crítico
  }
}

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

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / (1000 * 60 * 60))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch {
    return ''
  }
}

function notifText(n: UserNotifRow): string {
  const actor = n.actor.alias?.trim() || n.actor.nombre?.trim() || 'Alguien'
  switch (n.type) {
    case 'like_post':
      return `${actor} reaccionó a tu publicación`
    case 'comment_post':
      return `${actor} comentó tu publicación`
    case 'like_comment':
      return `${actor} reaccionó a tu comentario`
    default:
      return `${actor} interactuó contigo`
  }
}

function SocialNotifsSection({ userId }: { userId: string }) {
  const [notifs, setNotifs] = useState<UserNotifRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await fetchUserNotifs(supabase, userId)
      if (!cancelled) {
        setNotifs(data)
        setLoading(false)
        await markAllNotifsRead(supabase, userId)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading)
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex gap-3 border border-[#EEEEEE] p-3 animate-pulse"
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-[#F4F4F4]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-[#F4F4F4]" />
              <div className="h-2 w-1/4 bg-[#F4F4F4]" />
            </div>
          </div>
        ))}
      </div>
    )

  if (!notifs.length)
    return (
      <p
        className="py-8 text-center text-[13px] text-[#999999]"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        Aún no tienes notificaciones de actividad
      </p>
    )

  return (
    <div className="flex flex-col gap-2">
      {notifs.map((n) => {
        const name = n.actor.alias?.trim() || n.actor.nombre?.trim() || '?'
        return (
          <Link
            key={n.id}
            href={n.href ?? '/dashboard'}
            className={`flex items-center gap-3 border px-3 py-3 transition-colors cursor-pointer ${
              !n.read
                ? 'border-[#CC4B37]/20 bg-[#FFF8F7] hover:bg-[#FFF0EE]'
                : 'border-[#EEEEEE] bg-[#FFFFFF] hover:bg-[#F4F4F4]'
            }`}
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
              {n.actor.avatar_url ? (
                <img
                  src={n.actor.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#CC4B37]"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  {name[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] text-[#111111]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {notifText(n)}
              </p>
              <p
                className="mt-0.5 text-[11px] text-[#999999]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {timeAgo(n.created_at)}
              </p>
            </div>
            {!n.read ? (
              <div className="h-2 w-2 shrink-0 rounded-full bg-[#CC4B37]" />
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return iso
  }
}

function initialFromName(row: JoinRequestRow) {
  const s =
    row.solicitante_alias?.trim()?.[0] ||
    row.solicitante_nombre?.trim()?.[0] ||
    '?'
  return s.toUpperCase()
}

function solicitanteNombreLine(row: PendingFieldOwnerRequest) {
  const n = row.solicitante_nombre?.trim()
  if (n) return n
  const a = row.solicitante_alias?.trim()
  if (a) return `@${a}`
  return 'Un jugador'
}

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
      void sendPushNotif(
        row.user_id,
        'Solicitud aprobada',
        `Tu solicitud para unirte a ${row.team_nombre} fue aprobada`,
        `/equipos/${encodeURIComponent(row.team_slug)}`
      )
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
      void sendPushNotif(
        row.user_id,
        'Solicitud rechazada',
        `Tu solicitud para unirte a ${row.team_nombre} no fue aprobada`,
        '/dashboard/perfil?tab=notificaciones'
      )
    } catch {
      /* keep row */
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <section>
        <h2
          className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#999999]"
          style={jost}
        >
          ACTIVIDAD
        </h2>
        <SocialNotifsSection userId={userId} />
      </section>

      {(requests.length > 0 ||
        approvedFieldNotices.length > 0 ||
        ownerPendingFieldRequests.length > 0) && (
        <section>
          <h2
            className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#999999]"
            style={jost}
          >
            SOLICITUDES
          </h2>
          <div className="flex flex-col gap-8">
            {requests.length > 0 ? (
              <div>
                <h3
                  className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#999999]"
                  style={jost}
                >
                  Solicitudes de membresía
                </h3>
                <ul className="flex flex-col gap-4">
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
              </div>
            ) : null}

            {ownerPendingFieldRequests.length > 0 ? (
              <div>
                <h3
                  className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#999999]"
                  style={jost}
                >
                  Solicitudes en tus campos
                </h3>
                <ul className="flex flex-col gap-4">
                  {ownerPendingFieldRequests.map((row) => {
                    const fechaTxt = formatDateOnly(row.fecha_deseada)
                    const num = row.num_jugadores
                    return (
                      <li
                        key={row.id}
                        className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
                      >
                        <p className="text-[14px] text-[#111111]" style={lato}>
                          <span className="font-semibold">
                            {solicitanteNombreLine(row)}
                          </span>{' '}
                          quiere usar{' '}
                          <span className="font-semibold">{row.field_nombre}</span>
                        </p>
                        <p className="mt-2 text-[13px] text-[#666666]" style={lato}>
                          {fechaTxt ? (
                            <>
                              Fecha deseada:{' '}
                              <span className="font-semibold text-[#111111]">
                                {fechaTxt}
                              </span>
                            </>
                          ) : (
                            'Fecha deseada: —'
                          )}
                          {num != null ? (
                            <>
                              {' · '}
                              {num}{' '}
                              {num === 1 ? 'jugador' : 'jugadores'}
                            </>
                          ) : null}
                        </p>
                        <p
                          className="mt-1 text-[12px] text-[#666666]"
                          style={lato}
                        >
                          {relativeTime(row.created_at)}
                        </p>
                        <Link
                          href={`/mi-campo/${encodeURIComponent(row.field_id)}`}
                          style={jost}
                          className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-[#FFFFFF] sm:w-auto"
                        >
                          VER SOLICITUD
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}

            {approvedFieldNotices.length > 0 ? (
              <div>
                <h3
                  className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#999999]"
                  style={jost}
                >
                  Solicitudes de campo
                </h3>
                <ul className="flex flex-col gap-4">
                  {approvedFieldNotices.map((n) => {
                    const fechaTxt = formatDateOnly(n.fecha_deseada)
                    return (
                      <li
                        key={n.id}
                        className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
                      >
                        <p className="text-[14px] text-[#111111]" style={lato}>
                          Tu solicitud para{' '}
                          <span className="font-semibold">{n.field_nombre}</span>
                          {fechaTxt ? (
                            <>
                              {' '}
                              el {fechaTxt}{' '}
                            </>
                          ) : null}
                          fue aprobada
                        </p>
                        <p
                          className="mt-1 text-[12px] text-[#666666]"
                          style={lato}
                        >
                          {relativeTime(n.updated_at)}
                        </p>
                        <Link
                          href={`/eventos/${encodeURIComponent(n.event_id)}`}
                          style={jost}
                          className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-[#FFFFFF] sm:w-auto"
                        >
                          VER EVENTO
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  )
}
