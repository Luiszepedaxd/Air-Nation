export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '../../supabase-server'
import { ensureAppAdminOrRedirect } from '../../require-app-admin'
import { formatMsgDate } from '../format-msg-date'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

type UserRef = {
  id: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
}

type ConvRow = {
  id: string
  participant_1: string
  participant_2: string
  listing_id: string | null
  u1: UserRef | UserRef[] | null
  u2: UserRef | UserRef[] | null
  listing: { id: string; titulo: string | null } | { id: string; titulo: string | null }[] | null
}

type MessageRow = {
  id: string
  content: string | null
  sender_id: string
  created_at: string
  image_url: string | null
  read: boolean | null
}

function unwrap<T>(row: T | T[] | null | undefined): T | null {
  if (!row) return null
  return Array.isArray(row) ? row[0] ?? null : row
}

function displayUser(user: UserRef | null): string {
  if (!user) return '—'
  return user.alias?.trim() || user.nombre?.trim() || '—'
}

export default async function AdminConversacionPage({
  params,
}: {
  params: { id: string }
}) {
  await ensureAppAdminOrRedirect(`/admin/mensajes/${params.id}`)

  const supabase = createAdminClient()

  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      id, participant_1, participant_2, listing_id,
      u1:users!participant_1(id, alias, nombre, avatar_url),
      u2:users!participant_2(id, alias, nombre, avatar_url),
      listing:marketplace(id, titulo)
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!conv) notFound()

  const row = conv as ConvRow
  const u1 = unwrap(row.u1)
  const u2 = unwrap(row.u2)
  const listing = unwrap(row.listing)

  // TODO: paginar si crece
  const { data: msgs } = await supabase
    .from('messages')
    .select('id, content, sender_id, created_at, image_url, read')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(500)

  const messages = (msgs ?? []) as MessageRow[]
  const p1Name = displayUser(u1)
  const p2Name = displayUser(u2)

  return (
    <div className="flex min-h-full flex-col p-6" style={latoBody}>
      <header className="mb-6 flex flex-wrap items-center gap-3 border-b border-solid border-[#EEEEEE] pb-4">
        <Link
          href="/admin/mensajes"
          className="text-sm text-[#666666] transition-colors hover:text-[#CC4B37]"
        >
          ← Mensajes
        </Link>
        <span className="text-[#CCCCCC]">|</span>
        <h1
          className="text-lg tracking-[0.1em] text-[#111111] md:text-xl"
          style={jostHeading}
        >
          {p1Name} ↔ {p2Name}
        </h1>
        {listing?.titulo?.trim() ? (
          <span
            className="ml-auto inline-block border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-2 py-1 text-[10px] tracking-[0.08em] text-[#666666]"
            style={{ ...jostHeading, borderRadius: 2 }}
          >
            Marketplace: {listing.titulo}
          </span>
        ) : null}
      </header>

      {messages.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-16 text-[#666666]">
          Sin mensajes aún
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const isP1 = msg.sender_id === row.participant_1
            const senderName = isP1 ? p1Name : p2Name
            const content = msg.content?.trim() ?? ''
            const imageUrl = msg.image_url?.trim() || null
            const unread = msg.read === false

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isP1 ? 'items-start' : 'items-end'}`}
              >
                <span
                  className="mb-1 text-[11px] font-semibold text-[#666666]"
                  style={jostHeading}
                >
                  {senderName}
                  {unread ? (
                    <span className="ml-2 inline-block bg-[#CC4B37] px-1.5 py-0.5 text-[9px] text-white">
                      NO LEÍDO
                    </span>
                  ) : null}
                </span>
                <div
                  className={`max-w-[75%] px-3 py-2 ${
                    isP1
                      ? 'bg-[#F4F4F4] text-[#111111]'
                      : 'bg-[#111111] text-white'
                  }`}
                  style={{ borderRadius: 2 }}
                >
                  {content ? (
                    <p className="whitespace-pre-wrap break-words text-sm">{content}</p>
                  ) : null}
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      className={`max-h-48 rounded object-contain ${content ? 'mt-2' : ''}`}
                    />
                  ) : null}
                </div>
                <span className="mt-1 text-[11px] text-[#999999]">
                  {formatMsgDate(msg.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
