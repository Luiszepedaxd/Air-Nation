'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type ConvItem = {
  id: string
  last_message: string | null
  last_message_at: string | null
  unread: number
  deletedByMe: boolean
  other_user: { id: string; alias: string | null; nombre: string | null; avatar_url: string | null }
  listing: { id: string; titulo: string; foto: string | null } | null
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / (1000 * 60 * 60))
    if (h < 1) return 'ahora'
    if (h < 24) return `${h}h`
    const d = Math.floor(h / 24)
    return d === 1 ? '1d' : `${d}d`
  } catch { return '' }
}

function SwipeableConvRow({
  conv,
  onDelete,
}: {
  conv: ConvItem
  onDelete: (id: string) => void
}) {
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const startX = useRef<number | null>(null)
  const lastX = useRef<number>(0)
  const velocity = useRef<number>(0)
  const THRESHOLD = 72
  const MAX_SWIPE = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    lastX.current = e.touches[0].clientX
    velocity.current = 0
    setSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return
    const currentX = e.touches[0].clientX
    velocity.current = currentX - lastX.current
    lastX.current = currentX
    const delta = currentX - startX.current
    const clamped = Math.max(-MAX_SWIPE, Math.min(0, delta))
    setOffset(clamped)
  }

  const handleTouchEnd = () => {
    setSwiping(false)
    if (offset < -THRESHOLD || velocity.current < -8) {
      setOffset(-MAX_SWIPE)
      setConfirmDelete(true)
    } else {
      setOffset(0)
    }
    startX.current = null
  }

  const handleConfirmDelete = () => {
    setOffset(0)
    setConfirmDelete(false)
    onDelete(conv.id)
  }

  const handleCancelDelete = () => {
    setOffset(0)
    setConfirmDelete(false)
  }

  const otherName = conv.other_user.alias || conv.other_user.nombre || 'Operador'

  return (
    <div className="relative overflow-hidden border-b border-[#EEEEEE] last:border-b-0">
      {/* Fondo rojo de borrado */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 px-5"
        style={{ opacity: Math.min(1, Math.abs(offset) / MAX_SWIPE) }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Contenido deslizable */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link
          href={`/dashboard/mensajes/${conv.id}`}
          prefetch={true}
          className="flex items-center gap-3 px-4 py-3"
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
            {conv.other_user.avatar_url ? (
              <img src={conv.other_user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#CC4B37]" style={jost}>
                {otherName[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`truncate text-[13px] uppercase ${conv.unread > 0 ? 'font-extrabold text-[#111111]' : 'font-semibold text-[#444444]'}`} style={jost}>
                {otherName}
              </p>
              <span className="shrink-0 text-[11px] text-[#999999]" style={lato}>
                {timeAgo(conv.last_message_at)}
              </span>
            </div>
            {conv.listing && (
              <p className="text-[10px] text-[#CC4B37] uppercase font-extrabold truncate" style={jost}>
                {conv.listing.titulo}
              </p>
            )}
            <p className={`truncate text-[12px] ${conv.unread > 0 ? 'font-semibold text-[#111111]' : 'text-[#666666]'}`} style={lato}>
              {conv.last_message?.startsWith('[LISTING:')
                ? 'Consulta sobre una publicacion'
                : conv.last_message || 'Sin mensajes aún'}
            </p>
          </div>
          {conv.unread > 0 && (
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#CC4B37] text-[10px] font-extrabold text-white" style={jost}>
              {conv.unread > 9 ? '9+' : conv.unread}
            </span>
          )}
        </Link>
      </div>

      {/* Modal de confirmación inline */}
      {confirmDelete && (
        <div className="absolute inset-0 flex items-center justify-between bg-[#FFFFFF] px-4 z-10">
          <p style={lato} className="text-[13px] text-[#111111]">
            ¿Eliminar esta conversación?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelDelete}
              style={jost}
              className="border border-[#EEEEEE] px-3 py-1.5 text-[11px] font-extrabold uppercase text-[#666666]"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              style={jost}
              className="bg-[#CC4B37] px-3 py-1.5 text-[11px] font-extrabold uppercase text-white"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function BandejaClient({
  currentUserId,
  conversations: initialConvs,
}: {
  currentUserId: string
  conversations: ConvItem[]
}) {
  const router = useRouter()
  const [convs, setConvs] = useState(initialConvs)

  useEffect(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    setConvs(initialConvs)
  }, [initialConvs])

  const handleDelete = async (convId: string) => {
    setConvs(prev => prev.filter(c => c.id !== convId))

    const { data: convRow } = await supabase
      .from('conversations')
      .select('participant_1, participant_2')
      .eq('id', convId)
      .maybeSingle()

    if (!convRow) return
    const cr = convRow as Record<string, unknown>
    const isP1 = String(cr.participant_1) === currentUserId
    const field = isP1 ? 'deleted_by_1' : 'deleted_by_2'
    const deletedAtField = isP1 ? 'deleted_at_1' : 'deleted_at_2'

    await supabase.from('conversations').update({
      [field]: true,
      [deletedAtField]: new Date().toISOString(),
    }).eq('id', convId)
  }

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="max-w-[640px] mx-auto">
        <div className="px-4 pt-6 pb-4">
          <h1 style={jost} className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]">
            Mensajes
          </h1>
        </div>

        {convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="#AAAAAA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]">Sin mensajes</p>
            <p style={lato} className="mt-2 text-[13px] text-[#999999] max-w-[260px]">
              Visita el perfil de un operador y envíale un mensaje
            </p>
          </div>
        ) : (
          <div className="border-t border-[#EEEEEE]">
            {convs.map(conv => (
              <SwipeableConvRow
                key={conv.id}
                conv={conv}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
