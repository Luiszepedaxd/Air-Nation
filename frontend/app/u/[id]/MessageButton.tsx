'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const defaultClassName =
  'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#EEEEEE] transition-colors hover:bg-[#F9F9F9]'

export function MessageButton({
  profileUserId,
  currentUserId,
  className,
}: {
  profileUserId: string
  currentUserId: string | null
  className?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!currentUserId || currentUserId === profileUserId) return null

  const handleClick = async () => {
    setLoading(true)
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_a: currentUserId,
        p_user_b: profileUserId,
      })
      if (error || convId == null || convId === '') throw error
      router.push(`/dashboard/mensajes/${convId}`)
    } catch {
      router.push('/dashboard/mensajes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      aria-label="Enviar mensaje"
      disabled={loading}
      className={`${className ?? defaultClassName} disabled:opacity-50`}
      onClick={() => void handleClick()}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin text-[#999999]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="#999999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}
