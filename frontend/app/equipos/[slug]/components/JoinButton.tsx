'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import type { MemberDisplay } from '../types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

type BtnState =
  | 'idle'
  | 'loading'
  | 'sent'
  | 'ya_miembro'
  | 'error'
  | 'checking'

export function JoinButton({
  teamId,
  slug,
  members,
}: {
  teamId: string
  slug: string
  members: MemberDisplay[]
}) {
  const router = useRouter()
  const [state, setState] = useState<BtnState>('checking')

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members]
  )

  useEffect(() => {
    let cancelled = false
    const supabase = createPublicSupabaseClient()

    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id ?? null
      if (cancelled) return

      if (uid && memberIds.has(uid)) {
        setState('ya_miembro')
        return
      }

      if (uid) {
        const { data: existing } = await supabase
          .from('team_join_requests')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', uid)
          .eq('status', 'pendiente')
          .maybeSingle()

        if (cancelled) return
        if (existing) {
          setState('sent')
          return
        }
      }

      if (!cancelled) setState('idle')
    })().catch(() => {
      if (!cancelled) setState('idle')
    })

    return () => {
      cancelled = true
    }
  }, [teamId, memberIds])

  const redirectPath = `/equipos/${encodeURIComponent(slug)}`

  const handleClick = useCallback(async () => {
    if (state === 'ya_miembro' || state === 'sent') return

    const supabase = createPublicSupabaseClient()
    const { data } = await supabase.auth.getUser()
    const uid = data.user?.id ?? null

    if (!uid) {
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    if (memberIds.has(uid)) {
      setState('ya_miembro')
      return
    }

    setState('loading')

    const { error } = await supabase.from('team_join_requests').insert({
      team_id: teamId,
      user_id: uid,
      status: 'pendiente',
    })

    if (!error) {
      setState('sent')
      return
    }

    const code = (error as { code?: string }).code
    const msg = error.message || ''
    if (
      code === '23505' ||
      msg.toLowerCase().includes('duplicate') ||
      msg.toLowerCase().includes('unique')
    ) {
      setState('sent')
      return
    }

    setState('error')
  }, [state, teamId, router, redirectPath, memberIds])

  if (state === 'checking') {
    return (
      <div className="h-12 w-full max-w-md animate-pulse bg-[#F4F4F4] md:w-64" />
    )
  }

  if (state === 'ya_miembro') {
    return (
      <p
        className="text-center text-[14px] text-[#666666]"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        Ya eres miembro de este equipo
      </p>
    )
  }

  if (state === 'sent') {
    return (
      <p
        style={jost}
        className="text-center text-[14px] font-extrabold uppercase text-[#111111]"
      >
        Solicitud enviada
      </p>
    )
  }

  return (
    <div className="flex flex-col items-stretch gap-2 md:items-start">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={state === 'loading'}
        style={jost}
        className="w-full rounded-[2px] bg-[#CC4B37] px-6 py-3 text-[14px] font-extrabold uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-60 md:w-auto"
      >
        {state === 'loading' ? 'Enviando…' : 'Unirse al equipo'}
      </button>
      {state === 'error' ? (
        <p
          className="text-center text-[12px] text-[#CC4B37] md:text-left"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          No se pudo enviar la solicitud. Intenta de nuevo más tarde.
        </p>
      ) : null}
    </div>
  )
}
