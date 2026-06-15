export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import { formatTimeAgo } from './format-msg-date'

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
}

type ListingRef = {
  id: string
  titulo: string | null
}

type ConvRow = {
  id: string
  last_message: string | null
  last_message_at: string | null
  participant_1: string
  participant_2: string
  listing_id: string | null
  u1: UserRef | UserRef[] | null
  u2: UserRef | UserRef[] | null
  listing: ListingRef | ListingRef[] | null
}

type GroupRow = {
  id: string
  name: string | null
  last_message: string | null
  last_message_at: string | null
  team_id: string | null
  teams: { nombre: string | null } | { nombre: string | null }[] | null
}

function unwrap<T>(row: T | T[] | null | undefined): T | null {
  if (!row) return null
  return Array.isArray(row) ? row[0] ?? null : row
}

function displayUser(user: UserRef | null): string {
  if (!user) return '—'
  return user.alias?.trim() || user.nombre?.trim() || '—'
}

function truncate(text: string | null, max = 60): string {
  if (!text?.trim()) return '—'
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

export default async function AdminMensajesPage() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const supabase = createAdminClient()

  const [{ data: convData }, { data: groupData }] = await Promise.all([
    supabase
      .from('conversations')
      .select(`
        id,
        last_message,
        last_message_at,
        participant_1,
        participant_2,
        listing_id,
        u1:users!participant_1(id, alias, nombre),
        u2:users!participant_2(id, alias, nombre),
        listing:marketplace(id, titulo)
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from('group_conversations')
      .select(`
        id,
        name,
        last_message,
        last_message_at,
        team_id,
        teams(nombre)
      `)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(50),
  ])

  const conversations = ((convData ?? []) as ConvRow[]).map((row) => {
    const u1 = unwrap(row.u1)
    const u2 = unwrap(row.u2)
    const listing = unwrap(row.listing)
    return {
      id: row.id,
      participants: `${displayUser(u1)} ↔ ${displayUser(u2)}`,
      lastMessage: truncate(row.last_message),
      timeAgo: formatTimeAgo(row.last_message_at),
      linkedTo: listing?.titulo?.trim() || '—',
    }
  })

  const groups = ((groupData ?? []) as GroupRow[]).map((row) => {
    const team = unwrap(row.teams)
    return {
      id: row.id,
      name: row.name?.trim() || '—',
      team: team?.nombre?.trim() || '—',
      lastMessage: truncate(row.last_message),
      timeAgo: formatTimeAgo(row.last_message_at),
    }
  })

  return (
    <div className="p-6" style={latoBody}>
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        MENSAJES
      </h1>

      <section className="mb-10">
        <h2
          className="mb-4 text-sm tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          CONVERSACIONES 1:1
        </h2>
        {conversations.length === 0 ? (
          <p className="py-12 text-center text-[#666666]">No hay conversaciones</p>
        ) : (
          <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]">
            <table className="w-full border-collapse text-left text-sm text-[#111111]">
              <thead>
                <tr className="bg-[#F4F4F4]">
                  {(['PARTICIPANTES', 'ÚLTIMO MENSAJE', 'HACE CUÁNTO', 'VINCULADA A'] as const).map(
                    (col) => (
                      <th
                        key={col}
                        className="border border-solid border-[#EEEEEE] px-3 py-3 text-[12px]"
                        style={jostHeading}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {conversations.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`group hover:bg-[#EEEEEE]/60 ${
                      i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'
                    }`}
                  >
                    <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                      <Link
                        href={`/admin/mensajes/${c.id}`}
                        className="text-[#111111] transition-colors group-hover:text-[#CC4B37]"
                      >
                        {c.participants}
                      </Link>
                    </td>
                    <td className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#666666]">
                      <Link href={`/admin/mensajes/${c.id}`} className="block">
                        {c.lastMessage}
                      </Link>
                    </td>
                    <td className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#666666]">
                      <Link href={`/admin/mensajes/${c.id}`} className="block">
                        {c.timeAgo}
                      </Link>
                    </td>
                    <td className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#666666]">
                      <Link href={`/admin/mensajes/${c.id}`} className="block">
                        {c.linkedTo}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2
          className="mb-4 text-sm tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          GRUPOS
        </h2>
        {groups.length === 0 ? (
          <p className="py-12 text-center text-[#666666]">No hay grupos</p>
        ) : (
          <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]">
            <table className="w-full border-collapse text-left text-sm text-[#111111]">
              <thead>
                <tr className="bg-[#F4F4F4]">
                  {(['NOMBRE DEL GRUPO', 'EQUIPO', 'ÚLTIMO MENSAJE', 'HACE CUÁNTO'] as const).map(
                    (col) => (
                      <th
                        key={col}
                        className="border border-solid border-[#EEEEEE] px-3 py-3 text-[12px]"
                        style={jostHeading}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {groups.map((g, i) => (
                  <tr
                    key={g.id}
                    className={`group hover:bg-[#EEEEEE]/60 ${
                      i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'
                    }`}
                  >
                    <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                      <Link
                        href={`/admin/mensajes/grupo/${g.id}`}
                        className="text-[#111111] transition-colors group-hover:text-[#CC4B37]"
                      >
                        {g.name}
                      </Link>
                    </td>
                    <td className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#666666]">
                      <Link href={`/admin/mensajes/grupo/${g.id}`} className="block">
                        {g.team}
                      </Link>
                    </td>
                    <td className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#666666]">
                      <Link href={`/admin/mensajes/grupo/${g.id}`} className="block">
                        {g.lastMessage}
                      </Link>
                    </td>
                    <td className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#666666]">
                      <Link href={`/admin/mensajes/grupo/${g.id}`} className="block">
                        {g.timeAgo}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
