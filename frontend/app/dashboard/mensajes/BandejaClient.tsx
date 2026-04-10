'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
    if (!confirm('¿Eliminar esta conversación? El historial se borrará solo para ti.')) return
    const conv = convs.find(c => c.id === convId)
    if (!conv) return

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

    // Marcar timestamp de borrado para este usuario (no borra mensajes del otro)
    await supabase.from('conversations').update({
      [field]: true,
      [deletedAtField]: new Date().toISOString(),
    }).eq('id', convId)

    setConvs(prev => prev.filter(c => c.id !== convId))
  }

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="px-4 pt-6 md:px-6 max-w-[640px] mx-auto">
        <h1 style={jost} className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px] mb-6">
          Mensajes
        </h1>

        {convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
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
          <div className="flex flex-col divide-y divide-[#EEEEEE]">
            {convs.map(conv => (
              <div key={conv.id} className="group flex items-center gap-3 py-3">
                <Link href={`/dashboard/mensajes/${conv.id}`} className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                    {conv.other_user.avatar_url ? (
                      <img src={conv.other_user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#CC4B37]" style={jost}>
                        {(conv.other_user.alias || conv.other_user.nombre || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-extrabold uppercase text-[#111111]" style={jost}>
                        {conv.other_user.alias || conv.other_user.nombre || 'Operador'}
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
                    <p className="truncate text-[12px] text-[#666666]" style={lato}>
                      {conv.last_message || 'Sin mensajes aún'}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#CC4B37] text-[10px] font-extrabold text-white" style={jost}>
                      {conv.unread > 9 ? '9+' : conv.unread}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(conv.id)}
                  className="shrink-0 p-2 text-[#DDDDDD] opacity-0 group-hover:opacity-100 hover:text-[#CC4B37] transition-all"
                  aria-label="Eliminar conversación"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
