'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type SearchResult = {
  id: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
}

export function NuevoGrupoModal({
  currentUserId,
  onClose,
}: {
  currentUserId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<'nombre' | 'miembros'>('nombre')
  const [groupName, setGroupName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<SearchResult[]>([])
  const [creating, setCreating] = useState(false)

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const { data } = await supabase
        .from('users')
        .select('id, alias, nombre, avatar_url')
        .ilike('alias', `%${q.trim()}%`)
        .neq('id', currentUserId)
        .limit(8)

      const selectedIds = new Set(selectedMembers.map(m => m.id))
      setSearchResults(
        (data ?? [])
          .map(r => r as Record<string, unknown>)
          .filter(r => !selectedIds.has(String(r.id)))
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

  const handleAddMember = (user: SearchResult) => {
    setSelectedMembers(prev => [...prev, user])
    setSearchResults(prev => prev.filter(r => r.id !== user.id))
    setSearchQuery('')
  }

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId))
  }

  const handleCreate = async () => {
    if (!groupName.trim() || creating) return
    setCreating(true)
    try {
      const { data: group, error: groupErr } = await supabase
        .from('group_conversations')
        .insert({
          name: groupName.trim(),
          created_by: currentUserId,
          team_id: null,
        })
        .select('id')
        .single()

      if (groupErr || !group) throw groupErr

      const groupId = (group as Record<string, unknown>).id as string

      await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: currentUserId,
        role: 'admin',
      })

      if (selectedMembers.length > 0) {
        await supabase.from('group_members').insert(
          selectedMembers.map(m => ({
            group_id: groupId,
            user_id: m.id,
            role: 'member',
          }))
        )
      }

      onClose()
      router.push(`/dashboard/mensajes/grupo/${groupId}`)
    } catch {
      /* noop */
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FFFFFF]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EEEEEE] px-4 py-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          style={jost}
          className="text-[12px] font-extrabold uppercase text-[#999999]"
        >
          CANCELAR
        </button>
        <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">
          NUEVO GRUPO
        </p>
        {step === 'miembros' ? (
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!groupName.trim() || creating}
            style={jost}
            className="text-[12px] font-extrabold uppercase text-[#CC4B37] disabled:opacity-40"
          >
            {creating ? 'CREANDO...' : 'CREAR'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { if (groupName.trim()) setStep('miembros') }}
            disabled={!groupName.trim()}
            style={jost}
            className="text-[12px] font-extrabold uppercase text-[#CC4B37] disabled:opacity-40"
          >
            SIGUIENTE
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Nombre */}
        {step === 'nombre' && (
          <div>
            <p style={jost} className="mb-3 text-[11px] font-extrabold uppercase text-[#999999]">
              Nombre del grupo
            </p>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value.slice(0, 50))}
              placeholder="Ej: Operación Nocturna"
              className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-[14px] text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
              style={lato}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && groupName.trim()) setStep('miembros')
              }}
            />
            <p style={lato} className="mt-1 text-right text-[11px] text-[#999999]">
              {groupName.length}/50
            </p>
          </div>
        )}

        {/* Agregar miembros */}
        {step === 'miembros' && (
          <div>
            {selectedMembers.length > 0 && (
              <div className="mb-4">
                <p style={jost} className="mb-2 text-[11px] font-extrabold uppercase text-[#999999]">
                  Agregados ({selectedMembers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map(m => {
                    const name = m.alias || m.nombre || 'Operador'
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-1.5 border border-[#EEEEEE] bg-[#F4F4F4] px-2 py-1"
                      >
                        <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-[#DDDDDD]">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-[#CC4B37]" style={jost}>
                              {name[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span style={jost} className="text-[10px] font-extrabold uppercase text-[#111111]">
                          {name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.id)}
                          className="ml-1 text-[#999999] hover:text-[#CC4B37]"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p style={jost} className="mb-3 text-[11px] font-extrabold uppercase text-[#999999]">
              Buscar operadores
            </p>
            <input
              type="text"
              value={searchQuery}
              onChange={e => void handleSearch(e.target.value)}
              placeholder="Buscar por alias..."
              className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2.5 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
              style={lato}
              autoFocus
            />

            {searching && (
              <p style={lato} className="mt-2 text-[12px] text-[#999999]">Buscando...</p>
            )}

            {searchResults.length > 0 && (
              <div className="mt-2 border border-[#EEEEEE]">
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
                        onClick={() => handleAddMember(result)}
                        style={jost}
                        className="shrink-0 bg-[#CC4B37] px-3 py-1.5 text-[10px] font-extrabold uppercase text-white"
                      >
                        AGREGAR
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <p style={lato} className="mt-3 text-center text-[12px] text-[#999999]">
                No se encontraron operadores con ese alias
              </p>
            )}

            <p style={lato} className="mt-6 text-center text-[12px] text-[#999999]">
              Puedes agregar más integrantes después desde la info del grupo
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
