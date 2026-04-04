'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { FieldReviewPublic } from '@/app/campos/types'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

export type FieldRequestOwnerRow = {
  id: string
  field_id: string
  solicitante_id: string
  team_id: string | null
  fecha_deseada: string | null
  numero_jugadores: number | null
  mensaje: string | null
  created_at: string
  nombre: string | null
  alias: string | null
  avatar_url: string | null
  ciudad: string | null
  team_nombre: string | null
}

type TabId = 'info' | 'reviews' | 'requests'

type FieldHeader = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  tipo: string | null
  status: string
  descripcion: string | null
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} ${hrs === 1 ? 'hora' : 'horas'}`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function initialFromUser(nombre: string | null, alias: string | null) {
  const s = alias?.trim()?.[0] || nombre?.trim()?.[0] || '?'
  return s.toUpperCase()
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'aprobado') return 'bg-[#111111] text-[#FFFFFF]'
  if (s === 'rejected' || s === 'rechazado') return 'bg-[#CC4B37] text-[#FFFFFF]'
  return 'bg-[#F4F4F4] text-[#666666]'
}

function statusLabel(status: string) {
  const s = status.toLowerCase()
  if (s === 'aprobado') return 'APROBADO'
  if (s === 'rejected' || s === 'rechazado') return 'RECHAZADO'
  if (s === 'pending' || s === 'pendiente') return 'PENDIENTE'
  return status.toUpperCase()
}

function tipoLabel(tipo: string | null) {
  const t = (tipo || '').toLowerCase()
  if (t === 'privado') return 'PRIVADO'
  return 'PÚBLICO'
}

function StarsReadonly({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={14} height={14} viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.77L10 2.5z"
            fill={i <= value ? '#CC4B37' : 'none'}
            stroke={i <= value ? '#CC4B37' : '#CCCCCC'}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}

function MemberNameLine({
  nombre,
  alias,
}: {
  nombre: string | null
  alias: string | null
}) {
  const n = nombre?.trim() || ''
  const a = alias?.trim() || ''
  if (n && a) {
    return (
      <p className="text-[14px] text-[#111111]" style={lato}>
        <span className="font-semibold">{n}</span>
        <span className="text-[#666666]"> · @{a}</span>
      </p>
    )
  }
  if (n) {
    return (
      <p className="text-[14px] text-[#111111]" style={lato}>
        <span className="font-semibold">{n}</span>
      </p>
    )
  }
  if (a) {
    return (
      <p className="text-[14px] text-[#111111]" style={lato}>
        <span className="font-semibold">@{a}</span>
      </p>
    )
  }
  return (
    <p className="text-[14px] italic text-[#AAAAAA]" style={lato}>
      Usuario
    </p>
  )
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return '—'
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

/** Bloque 6: persistir evento en `public.events` cuando se apruebe una solicitud. */
async function placeholderCreateEventFromApprovedRequest(_requestId: string) {
  void _requestId
}

export function MiCampoOwnerClient({
  field,
  initialReviews,
  initialRequests,
}: {
  field: FieldHeader
  initialReviews: FieldReviewPublic[]
  initialRequests: FieldRequestOwnerRow[]
}) {
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [reviews] = useState<FieldReviewPublic[]>(initialReviews)
  const [requests, setRequests] = useState<FieldRequestOwnerRow[]>(initialRequests)

  const isPrivado = (field.tipo || '').toLowerCase() === 'privado'
  const approved = field.status.toLowerCase() === 'aprobado'
  const pendingCount = requests.length

  const tabClass = (tabId: TabId) =>
    activeTab === tabId
      ? 'border-b-2 border-[#CC4B37] text-[#111111] pb-[14px] px-4'
      : 'border-b-2 border-transparent text-[#666666] pb-[14px] px-4'

  useEffect(() => {
    const el = document.getElementById('dashboard-scroll-root')
    el?.scrollTo({ top: 0 })
  }, [activeTab])

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0

  const handleApprove = async (row: FieldRequestOwnerRow) => {
    try {
      const { error } = await supabase
        .from('field_requests')
        .update({
          status: 'aprobado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .eq('field_id', field.id)

      if (error) throw error

      await placeholderCreateEventFromApprovedRequest(row.id)
      setRequests((prev) => prev.filter((x) => x.id !== row.id))
    } catch {
      /* noop */
    }
  }

  const handleReject = async (row: FieldRequestOwnerRow) => {
    try {
      const { error } = await supabase
        .from('field_requests')
        .update({
          status: 'rechazado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .eq('field_id', field.id)

      if (error) throw error

      setRequests((prev) => prev.filter((x) => x.id !== row.id))
    } catch {
      /* noop */
    }
  }

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <div className="mb-6">
        <Link
          href="/dashboard/perfil"
          className="inline-flex items-center gap-1 text-[13px] text-[#666666] transition-colors hover:text-[#111111]"
          style={lato}
        >
          <span aria-hidden>←</span>
          <span className="font-semibold text-[#111111]">Perfil</span>
        </Link>
      </div>

      <h1
        style={jost}
        className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]"
      >
        MI CAMPO
      </h1>

      <div className="sticky top-0 z-40 -mx-4 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] md:-mx-6 md:top-16">
        <div className="flex overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            style={jost}
            className={`${tabBase} ${tabClass('info')}`}
          >
            INFORMACIÓN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            style={jost}
            className={`${tabBase} ${tabClass('reviews')}`}
          >
            RESEÑAS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={jost}
            className={`${tabBase} inline-flex items-center gap-1.5 ${tabClass('requests')}`}
          >
            <span>SOLICITUDES</span>
            {isPrivado && pendingCount > 0 ? (
              <span
                style={jost}
                className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#CC4B37] px-1 text-[10px] font-extrabold leading-none text-[#FFFFFF]"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'info' ? (
          <div className="flex flex-col gap-6 pb-10">
            <div className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
              <p
                className="text-[16px] text-[#111111]"
                style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
              >
                {field.nombre}
              </p>
              {field.ciudad?.trim() ? (
                <p className="mt-1 text-[13px] text-[#666666]" style={lato}>
                  {field.ciudad.trim()}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  style={jost}
                  className={`inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${statusBadgeClass(field.status)}`}
                >
                  {statusLabel(field.status)}
                </span>
                <span
                  className="text-[11px] uppercase tracking-wide text-[#999999]"
                  style={lato}
                >
                  {tipoLabel(field.tipo)}
                </span>
              </div>
              {field.descripcion?.trim() ? (
                <p
                  className="mt-4 text-[14px] leading-relaxed text-[#111111]"
                  style={lato}
                >
                  {field.descripcion.trim()}
                </p>
              ) : null}
            </div>

            <Link
              href={`/campos/${encodeURIComponent(field.slug)}/editar`}
              style={jost}
              className="flex h-12 w-full items-center justify-center bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
            >
              EDITAR CAMPO
            </Link>

            {approved ? (
              <a
                href={`/campos/${encodeURIComponent(field.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={jost}
                className="flex h-12 w-full items-center justify-center border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
              >
                VER PERFIL PÚBLICO
              </a>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'reviews' ? (
          <div className="pb-10">
            {reviews.length === 0 ? (
              <p className="text-[14px] text-[#666666]" style={lato}>
                Aún no tienes reseñas
              </p>
            ) : (
              <>
                <div className="mb-6 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
                  <p
                    style={jost}
                    className="text-[11px] font-extrabold uppercase text-[#999999]"
                  >
                    Promedio
                  </p>
                  <p
                    className="mt-1 text-[28px] font-semibold text-[#111111]"
                    style={lato}
                  >
                    {avgRating.toFixed(1)}
                  </p>
                  <div className="mt-2">
                    <StarsReadonly value={Math.round(avgRating)} />
                  </div>
                  <p className="mt-2 text-[12px] text-[#666666]" style={lato}>
                    {reviews.length}{' '}
                    {reviews.length === 1 ? 'reseña' : 'reseñas'}
                  </p>
                </div>
                <ul className="flex flex-col gap-4">
                  {reviews.map((r) => {
                    const u = r.users
                    return (
                      <li
                        key={`${r.user_id}-${r.created_at}`}
                        className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
                      >
                        <div className="flex gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden bg-[#F4F4F4]">
                            {u?.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt=""
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div
                                className="flex h-full w-full items-center justify-center text-[14px] text-[#CC4B37]"
                                style={{ ...jost, fontWeight: 700 }}
                              >
                                {initialFromUser(u?.nombre ?? null, u?.alias ?? null)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <MemberNameLine
                              nombre={u?.nombre ?? null}
                              alias={u?.alias ?? null}
                            />
                            <div className="mt-1">
                              <StarsReadonly value={r.rating} />
                            </div>
                            {r.comentario?.trim() ? (
                              <p
                                className="mt-2 text-[13px] text-[#111111]"
                                style={lato}
                              >
                                {r.comentario.trim()}
                              </p>
                            ) : null}
                            <p
                              className="mt-2 text-[12px] text-[#666666]"
                              style={lato}
                            >
                              {formatRelative(r.created_at)}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        ) : null}

        {activeTab === 'requests' ? (
          <div className="pb-10">
            {!isPrivado ? (
              <p className="text-[14px] text-[#666666]" style={lato}>
                Este es un campo público — no requiere solicitudes
              </p>
            ) : requests.length === 0 ? (
              <p className="text-[14px] text-[#666666]" style={lato}>
                No hay solicitudes pendientes
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {requests.map((row) => (
                  <li
                    key={row.id}
                    className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
                  >
                    <div className="flex gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
                        {row.avatar_url ? (
                          <img
                            src={row.avatar_url}
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
                            {initialFromUser(row.nombre, row.alias)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <MemberNameLine
                          nombre={row.nombre}
                          alias={row.alias}
                        />
                        {row.team_nombre?.trim() ? (
                          <p
                            className="mt-1 text-[12px] text-[#666666]"
                            style={lato}
                          >
                            Equipo:{' '}
                            <span className="font-semibold text-[#111111]">
                              {row.team_nombre.trim()}
                            </span>
                          </p>
                        ) : null}
                        <p
                          className="mt-2 text-[13px] text-[#111111]"
                          style={lato}
                        >
                          Fecha deseada:{' '}
                          <span className="font-semibold">
                            {formatDateOnly(row.fecha_deseada)}
                          </span>
                        </p>
                        <p className="mt-1 text-[13px] text-[#111111]" style={lato}>
                          Jugadores:{' '}
                          <span className="font-semibold">
                            {row.numero_jugadores ?? '—'}
                          </span>
                        </p>
                        {row.mensaje?.trim() ? (
                          <p
                            className="mt-2 text-[13px] italic text-[#666666]"
                            style={lato}
                          >
                            {row.mensaje.trim()}
                          </p>
                        ) : null}
                        <p
                          className="mt-2 text-[12px] text-[#666666]"
                          style={lato}
                        >
                          {formatRelative(row.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleApprove(row)}
                        style={jost}
                        className="min-h-[40px] min-w-[120px] flex-1 bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-[#FFFFFF] sm:flex-none"
                      >
                        APROBAR
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReject(row)}
                        style={jost}
                        className="min-h-[40px] min-w-[120px] flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2 text-[11px] font-extrabold uppercase text-[#666666] sm:flex-none"
                      >
                        RECHAZAR
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}
