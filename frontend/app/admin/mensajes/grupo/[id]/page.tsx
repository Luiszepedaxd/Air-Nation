export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '../../../supabase-server'
import { ensureAppAdminOrRedirect } from '../../../require-app-admin'
import { formatMsgDate } from '../../format-msg-date'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

const SENDER_COLORS = ['#CC4B37', '#111111', '#444444', '#666666'] as const

type GroupRow = {
  id: string
  name: string | null
  avatar_url: string | null
  team_id: string | null
  teams: { nombre: string | null } | { nombre: string | null }[] | null
}

type MemberRow = {
  user_id: string
  role: string | null
  users: {
    id: string
    alias: string | null
    nombre: string | null
    avatar_url: string | null
  } | {
    id: string
    alias: string | null
    nombre: string | null
    avatar_url: string | null
  }[] | null
}

type GroupMessageRow = {
  id: string
  sender_id: string
  content: string | null
  image_url: string | null
  created_at: string
}

function unwrap<T>(row: T | T[] | null | undefined): T | null {
  if (!row) return null
  return Array.isArray(row) ? row[0] ?? null : row
}

function displayUser(user: {
  alias: string | null
  nombre: string | null
} | null): string {
  if (!user) return '—'
  return user.alias?.trim() || user.nombre?.trim() || '—'
}

function senderColor(senderId: string, memberIds: string[]): string {
  const idx = memberIds.indexOf(senderId)
  if (idx < 0) return SENDER_COLORS[0]
  return SENDER_COLORS[idx % SENDER_COLORS.length]
}

export default async function AdminGrupoConversacionPage({
  params,
}: {
  params: { id: string }
}) {
  await ensureAppAdminOrRedirect(`/admin/mensajes/grupo/${params.id}`)

  const supabase = createAdminClient()

  const { data: group } = await supabase
    .from('group_conversations')
    .select(`
      id, name, avatar_url, team_id,
      teams(nombre)
    `)
    .eq('id', params.id)
    .maybeSingle()

  if (!group) notFound()

  const g = group as GroupRow
  const team = unwrap(g.teams)

  const { data: membersRaw } = await supabase
    .from('group_members')
    .select('user_id, role, users(id, alias, nombre, avatar_url)')
    .eq('group_id', params.id)

  const members = ((membersRaw ?? []) as MemberRow[]).map((row) => {
    const u = unwrap(row.users)
    return {
      user_id: row.user_id,
      role: row.role ?? '',
      alias: u?.alias ?? null,
      nombre: u?.nombre ?? null,
      avatar_url: u?.avatar_url ?? null,
    }
  })

  const memberIds = members.map((m) => m.user_id)
  const senderMap = new Map(
    members.map((m) => [m.user_id, displayUser(m)])
  )

  // TODO: paginar si crece
  const { data: msgs } = await supabase
    .from('group_messages')
    .select('id, sender_id, content, image_url, created_at')
    .eq('group_id', params.id)
    .order('created_at', { ascending: true })
    .limit(500)

  const messages = (msgs ?? []) as GroupMessageRow[]
  const groupName = g.name?.trim() || '—'

  return (
    <div className="flex min-h-full flex-col p-6" style={latoBody}>
      <header className="mb-4 flex flex-wrap items-center gap-3 border-b border-solid border-[#EEEEEE] pb-4">
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
          {groupName}
        </h1>
        {team?.nombre?.trim() ? (
          <>
            <span className="text-[#CCCCCC]">|</span>
            <span className="text-sm text-[#666666]">{team.nombre}</span>
          </>
        ) : null}
      </header>

      {members.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span
            className="text-[10px] tracking-[0.1em] text-[#666666]"
            style={jostHeading}
          >
            Miembros:
          </span>
          {members.map((m) => {
            const label = displayUser(m)
            const initial = label.charAt(0).toUpperCase()
            return (
              <div
                key={m.user_id}
                className="flex items-center gap-1.5 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-2 py-1"
                style={{ borderRadius: 2 }}
              >
                {m.avatar_url?.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.avatar_url}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-5 w-5 items-center justify-center bg-[#EEEEEE] text-[10px] text-[#666666]"
                    style={{ borderRadius: '50%' }}
                  >
                    {initial}
                  </span>
                )}
                <span className="text-xs text-[#111111]">{label}</span>
              </div>
            )
          })}
        </div>
      ) : null}

      {messages.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-16 text-[#666666]">
          Sin mensajes aún
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((msg) => {
            const senderName = senderMap.get(msg.sender_id) ?? '—'
            const color = senderColor(msg.sender_id, memberIds)
            const content = msg.content?.trim() ?? ''
            const imageUrl = msg.image_url?.trim() || null

            return (
              <div key={msg.id} className="flex flex-col items-start">
                <span
                  className="mb-1 text-[11px] font-semibold"
                  style={{ ...jostHeading, color }}
                >
                  {senderName}
                </span>
                <div
                  className="max-w-[75%] bg-[#F4F4F4] px-3 py-2 text-[#111111]"
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
