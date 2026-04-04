'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { MemberDisplay } from '../types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

function isEditorRole(rol: string | null) {
  const r = (rol || '').toLowerCase().trim()
  return r === 'founder' || r === 'admin'
}

function canEditTeam(members: MemberDisplay[], userId: string | null) {
  if (!userId) return false
  const uid = userId.trim()
  return members.some(
    (m) =>
      String(m.user_id).trim() === uid && isEditorRole(m.rol_plataforma)
  )
}

export function TeamEditLink({
  members,
  slug,
}: {
  members: MemberDisplay[]
  slug: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      const uid = data.user?.id ?? null
      setVisible(canEditTeam(members, uid))
    })
    return () => {
      cancelled = true
    }
  }, [members, slug])

  if (!visible) return null

  return (
    <div className="mt-4 flex justify-center">
      <Link
        href={`/equipos/${encodeURIComponent(slug)}/editar`}
        className="inline-block border border-[#EEEEEE] bg-transparent px-4 py-2 text-[11px] text-[#666666] transition-colors hover:border-[#CCCCCC] hover:text-[#111111]"
        style={jost}
      >
        Editar equipo
      </Link>
    </div>
  )
}
