'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export function FollowButton({
  profileUserId,
  currentUserId,
  initialIsFollowing,
}: {
  profileUserId: string
  currentUserId: string | null
  initialIsFollowing: boolean
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)

  if (!currentUserId) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center rounded-[4px] border border-[#CC4B37] bg-[#CC4B37] px-4 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:bg-[#B84330]"
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

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      style={jost}
      className={
        isFollowing
          ? 'inline-flex items-center justify-center rounded-[4px] border border-[#CCCCCC] bg-transparent px-4 py-1.5 text-[11px] font-extrabold text-[#111111] transition-colors hover:bg-[#F4F4F4]'
          : 'inline-flex items-center justify-center rounded-[4px] border border-[#CC4B37] bg-[#CC4B37] px-4 py-1.5 text-[11px] font-extrabold text-white transition-colors hover:border-[#B84330] hover:bg-[#B84330]'
      }
    >
      {isFollowing ? 'Siguiendo' : 'Seguir'}
    </button>
  )
}
