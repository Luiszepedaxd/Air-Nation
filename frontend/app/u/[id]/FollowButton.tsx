'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const defaultLogin =
  'inline-flex items-center justify-center rounded-[4px] border border-[#CC4B37] bg-[#CC4B37] px-4 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:bg-[#B84330]'

const defaultFollowing =
  'inline-flex items-center justify-center rounded-[4px] border border-[#CCCCCC] bg-transparent px-4 py-1.5 text-[11px] font-extrabold text-[#111111] transition-colors hover:bg-[#F4F4F4]'

const defaultNotFollowing =
  'inline-flex items-center justify-center rounded-[4px] border border-[#CC4B37] bg-[#CC4B37] px-4 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:border-[#B84330] hover:bg-[#B84330]'

/** Colores de estado cuando se pasa `className` (layout viene del padre). */
const stateFollowing = 'border-[#CCCCCC] bg-transparent text-[#111111] hover:bg-[#F4F4F4]'
const stateNotFollowing =
  'border-[#CC4B37] bg-[#CC4B37] text-white hover:border-[#B84330] hover:bg-[#B84330]'

export function FollowButton({
  profileUserId,
  currentUserId,
  initialIsFollowing,
  className,
}: {
  profileUserId: string
  currentUserId: string | null
  initialIsFollowing: boolean
  /** Si se pasa, sustituye el layout por defecto; se siguen aplicando estilos de estado (siguiendo / no). */
  className?: string
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)

  if (!currentUserId) {
    return (
      <Link
        href="/login"
        className={
          className
            ? `${className} flex items-center justify-center border font-extrabold transition-colors ${stateNotFollowing}`
            : defaultLogin
        }
        style={jost}
      >
        Seguir
      </Link>
    )
  }

  if (currentUserId === profileUserId) return null

  const toggle = async () => {
    const next = !isFollowing
    setIsFollowing(next)

    if (next) {
      const { error } = await supabase.from('user_follows').insert({
        follower_id: currentUserId,
        following_id: profileUserId,
      })
      if (error) {
        console.error('[FollowButton] insert', error)
        setIsFollowing(!next)
      }
    } else {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profileUserId)
      if (error) {
        console.error('[FollowButton] delete', error)
        setIsFollowing(!next)
      }
    }
  }

  const buttonClass = className
    ? `${className} flex items-center justify-center border font-extrabold transition-colors ${isFollowing ? stateFollowing : stateNotFollowing}`
    : isFollowing
      ? defaultFollowing
      : defaultNotFollowing

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      style={jost}
      className={buttonClass}
    >
      {isFollowing ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
