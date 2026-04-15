'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Member = {
  user_id: string
  role: string
  joined_at: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
}

type SearchResult = {
  id: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
}

export function GrupoInfoClient({
  groupId,
  groupName,
  groupAvatar,
  teamId,
  currentUserId,
  currentUserRole,
  members: initialMembers,
}: {
  groupId: string
  groupName: string
  groupAvatar: string | null
  teamId: string | null
  currentUserId: string
  currentUserRole: string
  members: Member[]
}) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const isAdmin = currentUserRole === 'admin'
  const initial = (groupName.trim()[0] || 'G').toUpperCase()

  // Suppress unused-var warnings for props reserved for future use
  void teamId

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const { data } = await supabase
        .from('users')
        .select('id, alias, nombre, avatar_url')
        .ilike('alias', `%${q.trim()}%`)
        .limit(8)

      const existingIds = new Set(members.map(m => m.user_id))
      setSearchResults(
        (data ?? [])
          .map(r => r as Record<string, unknown>)
          .filter(r => !existingIds.has(String(r.id)))
          .map(r => ({
            id: String(r.id),
            alias: r.alias ? String(r.alias) : null,
            nombre: r.nombre ? String(r.nombre) : null,
            avatar_url: r.avatar_url ? String(r.avatar_url) : null,
          }))
      )
    } finally {
      setSearching(false)
    }
  }

  const handleInvite = async (user: SearchResult) => {
    setBusyId(user.id)
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id, role: 'member' })
      if (error) throw error

      setMembers(prev => [...prev, {
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString(),
        alias: user.alias,
        nombre: user.nombre,
        avatar_url: user.avatar_url,
      }])
      setSearchResults(prev => prev.filter(r => r.id !== user.id))
      setSearchQuery('')
    } catch {
      /* noop */
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!isAdmin || userId === currentUserId) return
    setBusyId(userId)
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)
      if (error) throw error
      setMembers(prev => prev.filter(m => m.user_id !== userId))
    } catch {
      /* noop */
    } finally {
      setBusyId(null)
    }
  }

  const handlePromote = async (userId: string) => {
    if (!isAdmin) return
    setBusyId(userId)
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', userId)
      if (error) throw error
      setMembers(prev => prev.map(m =>
        m.user_id === userId ? { ...m, role: 'admin' } : m
      ))
    } catch {
      /* noop */
    } finally {
      setBusyId(null)
    }
  }

  const handleLeave = async () => {
    if (leaving) return
    setLeaving(true)
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUserId)
      if (error) throw error
      router.replace('/dashboard/mensajes')
    } catch {
      setLeaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#EEEEEE] px-4 py-3 sticky top-0 bg-[#FFFFFF] z-10">
        <Link
          href={`/dashboard/mensajes/grupo/${groupId}`}
          className="text-[#999999] hover:text-[#111111] mr-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <p style={jost} className="text-[14px] font-extrabold uppercase text-[#111111]">
          Info del grupo
        </p>
      </div>

      <div className="mx-auto max-w-[640px] px-4 pb-20">
        {/* Avatar + nombre del grupo */}
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-[#111111]">
            {groupAvatar ? (
              <img src={groupAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[28px] font-bold text-white" style={jost}>
                {initial}
              </div>
            )}
          </div>
          <p style={jost} className="text-[18px] font-extrabold uppercase text-[#111111] text-center">
            {groupName}
          </p>
          <p style={lato} className="text-[13px] text-[#999999]">
            {members.length} integrante{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Buscar e invitar — solo admins */}
        {isAdmin && (
          <div className="mb-6">
            <p style={jost} className="mb-3 text-[11px] font-extrabold uppercase text-[#999999]">
              Agregar integrante
            </p>
            <input
              type="text"
              value={searchQuery}
              onChange={e => void handleSearch(e.target.value)}
              placeholder="Buscar por alias..."
              className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2.5 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
              style={lato}
            />
            {searching && (
              <p style={lato} className="mt-2 text-[12px] text-[#999999]">Buscando...</p>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-[#EEEEEE] bg-[#FFFFFF]">
                {searchResults.map(result => {
                  const name = result.alias || result.nombre || 'Operador'
                  return (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 border-b border-[#EEEEEE] px-3 py-2.5 last:border-b-0"
                    >
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                        {result.avatar_url ? (
                          <img src={result.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#CC4B37]" style={jost}>
                            {name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p style={jost} className="flex-1 truncate text-[12px] font-extrabold uppercase text-[#111111]">
                        {name}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleInvite(result)}
                        disabled={busyId === result.id}
                        style={jost}
                        className="shrink-0 bg-[#CC4B37] px-3 py-1.5 text-[10px] font-extrabold uppercase text-white disabled:opacity-50"
                      >
                        {busyId === result.id ? '...' : 'AGREGAR'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Lista de miembros */}
        <div className="mb-6">
          <p style={jost} className="mb-3 text-[11px] font-extrabold uppercase text-[#999999]">
            Integrantes
          </p>
          <div className="border border-[#EEEEEE]">
            {members.map(member => {
              const name = member.alias || member.nombre || 'Operador'
              const isMe = member.user_id === currentUserId
              return (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 border-b border-[#EEEEEE] px-3 py-3 last:border-b-0"
                >
                  <Link href={`/u/${member.user_id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#CC4B37]" style={jost}>
                          {name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p style={jost} className="truncate text-[12px] font-extrabold uppercase text-[#111111]">
                        {name} {isMe ? '(Tú)' : ''}
                      </p>
                      {member.role === 'admin' && (
                        <p style={lato} className="text-[10px] text-[#CC4B37]">Admin</p>
                      )}
                    </div>
                  </Link>

                  {isAdmin && !isMe && (
                    <div className="flex gap-2 shrink-0">
                      {member.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => void handlePromote(member.user_id)}
                          disabled={busyId === member.user_id}
                          style={jost}
                          className="border border-[#EEEEEE] px-2 py-1 text-[9px] font-extrabold uppercase text-[#666666] disabled:opacity-50"
                        >
                          {busyId === member.user_id ? '...' : 'ADMIN'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleRemove(member.user_id)}
                        disabled={busyId === member.user_id}
                        style={jost}
                        className="border border-[#CC4B37] px-2 py-1 text-[9px] font-extrabold uppercase text-[#CC4B37] disabled:opacity-50"
                      >
                        {busyId === member.user_id ? '...' : 'QUITAR'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Salir del grupo */}
        <button
          type="button"
          onClick={() => void handleLeave()}
          disabled={leaving}
          style={jost}
          className="w-full border border-[#CC4B37] py-3 text-[12px] font-extrabold uppercase text-[#CC4B37] disabled:opacity-50"
        >
          {leaving ? 'SALIENDO...' : 'SALIR DEL GRUPO'}
        </button>
      </div>
    </div>
  )
}
