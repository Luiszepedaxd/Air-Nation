'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/apiFetch'
import { Lightbox } from '@/components/posts/PhotoGrid'
import { sendPushNotif } from '@/lib/sendPushNotif'
import { useVisualViewport } from '@/hooks/useVisualViewport'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type GroupMessage = {
  id: string
  sender_id: string
  content: string
  image_url: string | null
  created_at: string
}

type Member = {
  user_id: string
  role: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
}

export function GrupoConversacionClient({
  groupId,
  groupName,
  groupAvatar,
  teamId,
  currentUserId,
  currentUserRole,
  members,
  initialMessages,
}: {
  groupId: string
  groupName: string
  groupAvatar: string | null
  teamId: string | null
  currentUserId: string
  currentUserRole: string
  members: Member[]
  initialMessages: GroupMessage[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendingImage, setSendingImage] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const viewportHeight = useVisualViewport()
  const inputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const memberMap = Object.fromEntries(members.map(m => [m.user_id, m]))

  // Suppress unused-var warnings for props used in future prompts
  void teamId
  void currentUserRole

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      }, (payload) => {
        const m = payload.new as GroupMessage
        if (m.sender_id === currentUserId) return
        setMessages(prev => {
          if (prev.some(x => x.id === m.id)) return prev
          return [...prev, m]
        })
        void supabase
          .from('group_message_reads')
          .upsert(
            { user_id: currentUserId, group_id: groupId, last_read_at: new Date().toISOString() },
            { onConflict: 'user_id,group_id' }
          )
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [groupId, currentUserId])

  const updateGroupLastMessage = async (content: string) => {
    await supabase
      .from('group_conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', groupId)
  }

  const notifyOtherMembers = async (title: string, body: string) => {
    const others = members.filter(m => m.user_id !== currentUserId)
    await Promise.all(
      others.map(m =>
        sendPushNotif(
          m.user_id,
          title,
          body,
          `/dashboard/mensajes/grupo/${groupId}`
        )
      )
    )
  }

  const handleSend = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')

    const tempId = `temp-${Date.now()}`
    const tempMsg: GroupMessage = {
      id: tempId,
      sender_id: currentUserId,
      content,
      image_url: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const { data: newMsg, error } = await supabase
        .from('group_messages')
        .insert({ group_id: groupId, sender_id: currentUserId, content })
        .select()
        .single()

      if (error) throw error

      setMessages(prev => prev.map(m => m.id === tempId ? newMsg as GroupMessage : m))

      await updateGroupLastMessage(content)

      const senderName = memberMap[currentUserId]?.alias
        || memberMap[currentUserId]?.nombre
        || 'Alguien'
      void notifyOtherMembers(
        groupName,
        `${senderName}: ${content.length > 60 ? content.slice(0, 60) + '…' : content}`
      )
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setText(content)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleSendImage = async (file: File) => {
    if (sendingImage) return
    setSendingImage(true)

    const tempId = `temp-img-${Date.now()}`
    const previewUrl = URL.createObjectURL(file)
    const tempMsg: GroupMessage = {
      id: tempId,
      sender_id: currentUserId,
      content: '',
      image_url: previewUrl,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const imageUrl = await uploadFile(file)

      const { data: newMsg, error } = await supabase
        .from('group_messages')
        .insert({ group_id: groupId, sender_id: currentUserId, content: '', image_url: imageUrl })
        .select()
        .single()

      if (error) throw error

      URL.revokeObjectURL(previewUrl)
      setMessages(prev => prev.map(m => m.id === tempId ? newMsg as GroupMessage : m))

      await updateGroupLastMessage('[FOTO]')

      const senderName = memberMap[currentUserId]?.alias
        || memberMap[currentUserId]?.nombre
        || 'Alguien'
      void notifyOtherMembers(groupName, `${senderName} envió una foto`)
    } catch {
      URL.revokeObjectURL(previewUrl)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSendingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const initial = (groupName.trim()[0] || 'G').toUpperCase()

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col bg-[#FFFFFF] z-10 overflow-hidden"
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
    >

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#EEEEEE] px-4 py-3 shrink-0">
        <Link href="/dashboard/mensajes" className="text-[#999999] hover:text-[#111111] mr-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#111111]">
            {groupAvatar ? (
              <img src={groupAvatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white" style={jost}>
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold uppercase text-[#111111]" style={jost}>
              {groupName}
            </p>
            <p className="text-[10px] text-[#999999]" style={lato}>
              {members.length} integrantes
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/mensajes/grupo/${groupId}/info`}
          className="shrink-0 p-2 text-[#999999] hover:text-[#111111]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 11v5M12 8v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
        {messages.length === 0 && (
          <p className="text-center text-[12px] text-[#999999] py-8" style={lato}>
            Sé el primero en escribir
          </p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const sender = memberMap[msg.sender_id]
          const senderName = sender?.alias || sender?.nombre || 'Operador'
          const prev = messages[i - 1]
          const sameSender = Boolean(prev && prev.sender_id === msg.sender_id)

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${sameSender ? 'mt-0.5' : 'mt-3'}`}
            >
              <div className={`flex max-w-[75%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && !sameSender ? (
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4] self-end">
                    {sender?.avatar_url ? (
                      <img src={sender.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-[#CC4B37]" style={jost}>
                        {senderName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                ) : !isMe ? (
                  <div className="w-7 shrink-0" />
                ) : null}

                <div className="flex flex-col">
                  {!isMe && !sameSender && (
                    <p className="mb-0.5 text-[10px] font-extrabold uppercase text-[#999999]" style={jost}>
                      {senderName}
                    </p>
                  )}

                  <div className={`text-[13px] leading-relaxed rounded-[12px] ${
                    msg.image_url
                      ? 'overflow-hidden p-0'
                      : isMe
                        ? 'bg-[#CC4B37] text-white rounded-br-[4px] px-3 py-2'
                        : 'bg-[#F4F4F4] text-[#111111] rounded-bl-[4px] px-3 py-2'
                  }`} style={lato}>
                    {msg.image_url ? (
                      <div
                        className="overflow-hidden rounded-[8px] cursor-pointer"
                        style={{ maxWidth: 220 }}
                        onClick={() => setLightboxUrl(msg.image_url!)}
                      >
                        <img
                          src={msg.image_url}
                          alt="Imagen"
                          className="w-full h-auto object-cover pointer-events-none"
                          style={{ display: 'block', maxHeight: 280 }}
                        />
                      </div>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>

                  <p className={`mt-0.5 text-[10px] text-[#AAAAAA] ${isMe ? 'text-right' : 'text-left'}`} style={lato}>
                    {new Date(msg.created_at).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[#EEEEEE] px-4 pt-3 pb-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        <div className="flex items-center gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) void handleSendImage(file)
            }}
          />

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={sendingImage}
            className="shrink-0 p-2 text-[#999999] hover:text-[#CC4B37] transition-colors disabled:opacity-40"
            aria-label="Adjuntar foto"
          >
            {sendingImage ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

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

      {lightboxUrl && (
        <Lightbox
          urls={[lightboxUrl]}
          startIndex={0}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  )
}
