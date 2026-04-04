'use client'

import { useCallback, useMemo, useState } from 'react'
import { ReviewForm } from './ReviewForm'
import type { FieldReviewPublic } from '../../types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

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

function displayName(r: FieldReviewPublic): string {
  const u = r.users
  const a = u?.alias?.trim()
  if (a) return a
  const n = u?.nombre?.trim()
  if (n) return n
  return 'Jugador'
}

function initialFromReview(r: FieldReviewPublic): string {
  const base = displayName(r)
  return base.charAt(0).toUpperCase() || '?'
}

function StarsSmall({ value }: { value: number }) {
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

function StarsLarge({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={28} height={28} viewBox="0 0 20 20" fill="none">
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

type Props = {
  fieldId: string
  slug: string
  initialReviews: FieldReviewPublic[]
}

export function CampoReviews({ fieldId, slug, initialReviews }: Props) {
  const [reviews, setReviews] = useState<FieldReviewPublic[]>(initialReviews)

  const { average, count } = useMemo(() => {
    const c = reviews.length
    if (!c) return { average: 0, count: 0 }
    const sum = reviews.reduce((s, r) => s + r.rating, 0)
    return { average: sum / c, count: c }
  }, [reviews])

  const handleSaved = useCallback((row: FieldReviewPublic) => {
    setReviews((prev) => {
      const i = prev.findIndex((r) => r.user_id === row.user_id)
      const next =
        i >= 0 ? prev.map((r, idx) => (idx === i ? row : r)) : [row, ...prev]
      return next.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
  }, [])

  return (
    <section className="border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-6 md:px-6">
      <h2
        className="border-b border-[#EEEEEE] pb-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#111111]"
        style={jost}
      >
        Reseñas
      </h2>

      <div className="mt-6 flex flex-col gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            style={jost}
          >
            Promedio
          </p>
          {count > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StarsLarge value={Math.round(average)} />
              <span
                className="text-2xl font-extrabold text-[#111111]"
                style={jost}
              >
                {average.toFixed(1)}
              </span>
              <span className="text-sm text-[#666666]" style={lato}>
                {count} {count === 1 ? 'reseña' : 'reseñas'}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#999999]" style={lato}>
              Sin reseñas aún
            </p>
          )}
        </div>
      </div>

      <ul className="mt-6 list-none space-y-4 p-0 m-0">
        {reviews.length === 0 ? (
          <li>
            <p className="text-center text-sm text-[#666666]" style={lato}>
              Sé el primero en reseñar este campo.
            </p>
          </li>
        ) : (
          reviews.map((r) => (
            <li
              key={r.user_id}
              className="border border-[#EEEEEE] bg-[#FFFFFF] p-4"
            >
              <div className="flex gap-3">
                {r.users?.avatar_url ? (
                  <img
                    src={r.users.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 border border-[#EEEEEE] object-cover"
                  />
                ) : (
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] text-sm font-extrabold text-[#666666]"
                    style={jost}
                  >
                    {initialFromReview(r)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-sm font-extrabold text-[#111111]"
                      style={jost}
                    >
                      {displayName(r)}
                    </span>
                    <span className="text-[11px] text-[#999999]" style={lato}>
                      {formatRelative(r.created_at)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <StarsSmall value={r.rating} />
                  </div>
                  {r.comentario ? (
                    <p
                      className="mt-2 text-sm leading-relaxed text-[#111111]"
                      style={lato}
                    >
                      {r.comentario}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="mt-8">
        <ReviewForm fieldId={fieldId} slug={slug} onSaved={handleSaved} />
      </div>
    </section>
  )
}
