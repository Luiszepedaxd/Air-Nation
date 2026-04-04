'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { FieldReviewPublic } from '../../types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Props = {
  fieldId: string
  slug: string
  onSaved: (row: FieldReviewPublic) => void
}

function StarPick({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (n: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= value
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onChange(i)}
            className="border-0 bg-transparent p-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={`${i} estrellas`}
          >
            <svg width={32} height={32} viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.77L10 2.5z"
                fill={active ? '#CC4B37' : 'none'}
                stroke={active ? '#CC4B37' : '#CCCCCC'}
                strokeWidth={1.3}
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

export function ReviewForm({ fieldId, slug, onSaved }: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState<FieldReviewPublic | null>(null)
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(5)
  const [comentario, setComentario] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = `/campos/${slug}`

  const loadMine = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setUserId(null)
      setExisting(null)
      setLoading(false)
      return
    }
    setUserId(user.id)
    const { data } = await supabase
      .from('field_reviews')
      .select(
        `
        user_id,
        rating,
        comentario,
        created_at,
        users ( nombre, alias, avatar_url )
      `
      )
      .eq('field_id', fieldId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (data) {
      const r = data as Record<string, unknown>
      const uRaw = r.users
      const uSingle = Array.isArray(uRaw) ? uRaw[0] : uRaw
      const users =
        uSingle && typeof uSingle === 'object'
          ? {
              nombre: (uSingle as { nombre?: string | null }).nombre ?? null,
              alias: (uSingle as { alias?: string | null }).alias ?? null,
              avatar_url:
                (uSingle as { avatar_url?: string | null }).avatar_url ?? null,
            }
          : null
      const row: FieldReviewPublic = {
        user_id: String(r.user_id ?? ''),
        rating: Number(r.rating ?? 0),
        comentario: (r.comentario as string | null) ?? null,
        created_at: String(r.created_at ?? ''),
        users,
      }
      setExisting(row)
      setRating(row.rating)
      setComentario(row.comentario ?? '')
      setEditing(false)
    } else {
      setExisting(null)
      setRating(5)
      setComentario('')
      setEditing(true)
    }
    setLoading(false)
  }, [fieldId])

  useEffect(() => {
    void loadMine()
  }, [loadMine])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadMine()
    })
    return () => subscription.unsubscribe()
  }, [loadMine])

  const handleSubmit = async () => {
    if (!userId) return
    setSaving(true)
    setError('')
    try {
      const com = comentario.trim().slice(0, 300)
      const payload = {
        field_id: fieldId,
        user_id: userId,
        rating,
        comentario: com || null,
      }

      const { error: insertError } = await supabase
        .from('field_reviews')
        .insert(payload)

      if (insertError) {
        const code =
          typeof insertError === 'object' && insertError !== null
            ? (insertError as { code?: string }).code
            : undefined
        if (code === '23505') {
          const { error: updateError } = await supabase
            .from('field_reviews')
            .update({ rating, comentario: com || null })
            .eq('field_id', fieldId)
            .eq('user_id', userId)
          if (updateError) {
            setError('No se pudo guardar')
            return
          }
        } else {
          setError('No se pudo guardar')
          return
        }
      }

      const { data: u } = await supabase
        .from('users')
        .select('nombre, alias, avatar_url')
        .eq('id', userId)
        .maybeSingle()

      const row: FieldReviewPublic = {
        user_id: userId,
        rating,
        comentario: com || null,
        created_at: existing?.created_at ?? new Date().toISOString(),
        users: u
          ? {
              nombre: u.nombre as string | null,
              alias: u.alias as string | null,
              avatar_url: u.avatar_url as string | null,
            }
          : null,
      }
      setExisting(row)
      setEditing(false)
      onSaved(row)
    } catch {
      setError('No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-[#666666]" style={lato}>
        Cargando…
      </p>
    )
  }

  if (!userId) {
    return (
      <p className="text-sm text-[#666666]" style={lato}>
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
          className="font-semibold text-[#CC4B37] underline-offset-2 hover:underline"
        >
          Inicia sesión
        </Link>{' '}
        para dejar una reseña.
      </p>
    )
  }

  if (existing && !editing) {
    return (
      <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
        <p
          className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
          style={jost}
        >
          Tu reseña
        </p>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} width={16} height={16} viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.77L10 2.5z"
                fill={i <= existing.rating ? '#CC4B37' : 'none'}
                stroke={i <= existing.rating ? '#CC4B37' : '#CCCCCC'}
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
            </svg>
          ))}
        </div>
        {existing.comentario ? (
          <p className="mt-2 text-sm text-[#111111]" style={lato}>
            {existing.comentario}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setRating(existing.rating)
            setComentario(existing.comentario ?? '')
            setEditing(true)
          }}
          className="mt-4 border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37]"
          style={{ ...jost, borderRadius: 2 }}
        >
          Editar
        </button>
      </div>
    )
  }

  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4 space-y-4">
      <div>
        <span
          className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
          style={jost}
        >
          Calificación
        </span>
        <StarPick value={rating} onChange={setRating} disabled={saving} />
      </div>
      <div>
        <label
          htmlFor="review-comentario"
          className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
          style={jost}
        >
          Comentario (opcional)
        </label>
        <textarea
          id="review-comentario"
          maxLength={300}
          rows={4}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          disabled={saving}
          className="w-full resize-y border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
          style={lato}
          placeholder="Comparte tu experiencia en el campo…"
        />
        <p className="mt-1 text-right text-[11px] text-[#999999]" style={lato}>
          {comentario.length}/300
        </p>
      </div>
      {error ? (
        <p className="text-sm text-[#CC4B37]" style={lato}>
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSubmit()}
          className="border border-[#CC4B37] bg-[#CC4B37] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white disabled:opacity-45"
          style={{ ...jost, borderRadius: 2 }}
        >
          {existing ? 'ACTUALIZAR RESEÑA' : 'PUBLICAR RESEÑA'}
        </button>
        {existing && editing ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setEditing(false)
              setRating(existing.rating)
              setComentario(existing.comentario ?? '')
            }}
            className="border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#666666]"
            style={{ ...jost, borderRadius: 2 }}
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  )
}
