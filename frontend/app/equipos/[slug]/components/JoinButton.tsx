'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { notifyTeamJoinRequest } from '@/lib/notify-team-join-request'
import type { MemberDisplay } from '../types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type JoinUiState =
  | 'checking'
  | 'ya_miembro'
  | 'pendiente'
  | 'rechazado'
  | 'sin_solicitud'
  | 'loading'
  | 'error'

const btnJoinClass =
  'w-full rounded-[2px] bg-[#CC4B37] px-6 py-3 text-[14px] font-extrabold uppercase text-white transition-opacity hover:opacity-90 disabled:opacity-60 md:w-auto'

export function JoinButton({
  teamId,
  slug,
  teamNombre,
  members,
}: {
  teamId: string
  slug: string
  teamNombre: string
  members: MemberDisplay[]
}) {
  const router = useRouter()
  const [state, setState] = useState<JoinUiState>('checking')

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.user_id)),
    [members]
  )

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const uid = user?.id ?? null
      if (cancelled) return

      if (!uid) {
        setState('sin_solicitud')
        return
      }

      if (memberIds.has(uid)) {
        setState('ya_miembro')
        return
      }

      const { data } = await supabase
        .from('team_join_requests')
        .select('status')
        .eq('team_id', teamId)
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (!data?.status) {
        setState('sin_solicitud')
        return
      }

      const st = String(data.status).toLowerCase()
      if (st === 'pendiente') {
        setState('pendiente')
        return
      }
      if (st === 'rechazado') {
        setState('rechazado')
        return
      }
      setState('sin_solicitud')
    })().catch(() => {
      if (!cancelled) setState('sin_solicitud')
    })

    return () => {
      cancelled = true
    }
  }, [teamId, memberIds])

  const redirectPath = `/equipos/${encodeURIComponent(slug)}`

  const sendJoinRequest = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const uid = user?.id ?? null
    if (!uid) return false

    setState('loading')

    const { error } = await supabase.from('team_join_requests').insert({
      team_id: teamId,
      user_id: uid,
      status: 'pendiente',
    })

    if (error) {
      const code = (error as { code?: string }).code
      if (code === '23505') {
        setState('pendiente')
        return true
      }
      setState('error')
      return false
    }

    const { data: profile } = await supabase
      .from('users')
      .select('nombre, alias')
      .eq('id', uid)
      .maybeSingle()

    await notifyTeamJoinRequest(teamId, {
      solicitante_nombre: (profile?.nombre as string | null)?.trim() || 'Usuario',
      solicitante_alias: (profile?.alias as string | null) ?? null,
      team_nombre: teamNombre,
    })

    setState('pendiente')
    return true
  }, [teamId, teamNombre])

  const handleClick = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const uid = user?.id ?? null

    if (!uid) {
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`)
      return
    }

    if (memberIds.has(uid)) {
      setState('ya_miembro')
      return
    }

    if (state === 'pendiente' || state === 'ya_miembro') return

    if (state === 'rechazado' || state === 'sin_solicitud') {
      await sendJoinRequest()
    }
  }, [state, router, redirectPath, memberIds, sendJoinRequest])

  if (state === 'checking') {
    return (
      <div className="h-12 w-full max-w-md animate-pulse bg-[#F4F4F4] md:w-64" />
    )
  }

  if (state === 'ya_miembro') {
    return (
      <p style={jost} className="text-center text-[11px] font-extrabold uppercase text-[#111111]">
        YA ERES MIEMBRO
      </p>
    )
  }

  if (state === 'pendiente') {
    return (
      <div
        style={jost}
        className="inline-flex w-full max-w-md items-center justify-center border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-[11px] font-extrabold uppercase text-[#666666] md:w-auto"
      >
        SOLICITUD PENDIENTE
      </div>
    )
  }

  return (
    <div className="flex flex-col items-stretch gap-2 md:items-start">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={state === 'loading'}
        style={jost}
        className={btnJoinClass}
      >
        {state === 'loading'
          ? 'Enviando…'
          : state === 'rechazado'
            ? 'VOLVER A SOLICITAR'
            : 'UNIRSE AL EQUIPO'}
      </button>
      {state === 'error' ? (
        <p
          className="text-center text-[12px] text-[#CC4B37] md:text-left"
          style={lato}
        >
          No se pudo enviar la solicitud. Intenta de nuevo más tarde.
        </p>
      ) : null}
    </div>
  )
}
