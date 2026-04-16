'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { FollowUser } from '@/types/follows'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type Props = {
  isOpen: boolean
  onClose: () => void
  userId: string
  mode: 'followers' | 'following'
  title: string
}

export function FollowListModal({ isOpen, onClose, userId, mode, title }: Props) {
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch(`/api/v1/users/${userId}/${mode}`)
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [isOpen, userId, mode])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const emptyLabel = mode === 'followers' ? 'seguidores' : 'siguiendo'

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div
        className="flex w-full max-w-[420px] flex-col bg-[#FFFFFF] md:max-h-[70vh]"
        style={{ borderRadius: 0, maxHeight: '70vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEEEEE] px-5 py-4">
          <h2 className="text-[15px] text-[#111111]" style={jost}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-[#999999] hover:text-[#111111]"
            style={{ borderRadius: 0 }}
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3" style={{ minHeight: 120 }}>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3">
                  <div className="h-10 w-10 shrink-0 bg-[#EEEEEE]" style={{ borderRadius: '50%' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-[#EEEEEE]" />
                    <div className="h-2.5 w-16 bg-[#F4F4F4]" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#999999]" style={lato}>
              Aún no hay {emptyLabel}
            </p>
          ) : (
            <ul className="space-y-1">
              {users.map((u) => {
                const initial = (u.alias?.trim()?.[0] || u.nombre?.trim()?.[0] || '?').toUpperCase()
                return (
                  <li key={u.id}>
                    <Link
                      href={`/u/${u.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-1 py-2 transition-colors hover:bg-[#F4F4F4]"
                      style={{ borderRadius: 0 }}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-[#CC4B37]"
                        style={{ borderRadius: '50%' }}
                      >
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[15px] text-[#FFFFFF]" style={jost}>
                            {initial}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-[#111111]" style={lato}>
                          {u.alias || u.nombre || 'Sin nombre'}
                        </p>
                        {u.nombre && u.alias ? (
                          <p className="truncate text-[12px] text-[#666666]" style={lato}>
                            {u.nombre}
                          </p>
                        ) : null}
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                        className="shrink-0 text-[#CCCCCC]"
                      >
                        <path
                          d="M9 18l6-6-6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
