'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Message = {
  id: string
  content: string
  sender_id: string
  read: boolean
  created_at: string
}

type OtherUser = {
  id: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
}

type ListingRef = {
  id: string
  titulo: string
  foto: string | null
}

export function ConversacionClient({
  conversationId,
  currentUserId,
  otherUser,
  listing,
  initialMessages,
}: {
  conversationId: string
  currentUserId: string
  otherUser: OtherUser
  listing: ListingRef | null
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const m = payload.new as Message
        if (m.sender_id === currentUserId) return
        setMessages(prev => {
          if (prev.some(x => x.id === m.id)) return prev
          return [...prev, m]
        })
        void supabase.from('messages').update({ read: true }).eq('id', m.id)
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [conversationId, currentUserId])

  const handleSend = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')

    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      content,
      sender_id: currentUserId,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: currentUserId, content })
        .select()
        .single()

      if (error) throw error

      setMessages(prev => prev.map(m => m.id === tempId ? newMsg as Message : m))

      const { data: convRow } = await supabase
        .from('conversations')
        .select('participant_1, participant_2, unread_1, unread_2')
        .eq('id', conversationId)
        .maybeSingle()

      if (convRow) {
        const cr = convRow as Record<string, unknown>
        const isP1 = String(cr.participant_1) === currentUserId
        const field = isP1 ? 'unread_2' : 'unread_1'
        const current = isP1 ? Number(cr.unread_2 ?? 0) : Number(cr.unread_1 ?? 0)
        await supabase.from('conversations').update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          [field]: current + 1,
        }).eq('id', conversationId)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setText(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const otherName = otherUser.alias || otherUser.nombre || 'Operador'

  return (
    <div className="fixed inset-x-0 top-0 md:top-16 flex flex-col bg-[#FFFFFF] z-10 overflow-hidden" style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#EEEEEE] px-4 py-3 shrink-0">
        <Link href="/dashboard/mensajes" className="text-[#999999] hover:text-[#111111] mr-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <Link href={`/u/${otherUser.id}`} className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
            {otherUser.avatar_url ? (
              <img src={otherUser.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#CC4B37]" style={jost}>
                {otherName[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold uppercase text-[#111111]" style={jost}>{otherName}</p>
            {listing && (
              <p className="truncate text-[10px] text-[#CC4B37] uppercase" style={jost}>{listing.titulo}</p>
            )}
          </div>
        </Link>
      </div>

      {/* Listing context si existe */}
      {listing && (
        <div className="flex items-center gap-3 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2 shrink-0">
          {listing.foto && (
            <img src={listing.foto} alt="" className="h-10 w-10 object-cover shrink-0" />
          )}
          <p className="truncate text-[12px] font-extrabold uppercase text-[#111111]" style={jost}>{listing.titulo}</p>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
        {messages.length === 0 && (
          <p className="text-center text-[12px] text-[#999999] py-8" style={lato}>
            Sé el primero en escribir
          </p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const prev = messages[i - 1]
          const sameSenderAsPrev = Boolean(prev && prev.sender_id === msg.sender_id)
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${sameSenderAsPrev ? 'mt-0.5' : 'mt-3'}`}>
              <div className="flex max-w-[75%] flex-col">
                <div className={`px-3 py-2 text-[13px] leading-relaxed rounded-[12px] ${
                  isMe
                    ? 'bg-[#CC4B37] text-white rounded-br-[4px]'
                    : 'bg-[#F4F4F4] text-[#111111] rounded-bl-[4px]'
                }`} style={lato}>
                  {msg.content}
                </div>
                <p className={`mt-0.5 text-[10px] text-[#AAAAAA] ${isMe ? 'text-right' : 'text-left'}`} style={lato}>
                  {new Date(msg.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#EEEEEE] px-4 py-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
            placeholder="Escribe un mensaje..."
            className="flex-1 border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2.5 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
            style={lato}
            maxLength={1000}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!text.trim() || sending}
            className="shrink-0 bg-[#CC4B37] px-4 py-2.5 text-white disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
