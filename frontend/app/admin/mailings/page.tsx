export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import MailingsClient from './MailingsClient'

export type MailingUser = {
  id: string
  email: string | null
  alias: string | null
  nombre: string | null
  avatar_url: string | null
  created_at: string | null
  last_sign_in_at: string | null
}

export type MailingHistoryRow = {
  id: string
  asunto: string
  recipient_count: number
  sent_count: number
  failed_count: number
  created_at: string
}

type ProfileRow = {
  id: string
  email: string | null
  alias: string | null
  nombre: string | null
  avatar_url: string | null
  created_at: string | null
}

export default async function MailingsPage() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const db = createAdminClient()

  const { data: profileRows } = await db
    .from('users')
    .select('id, email, alias, nombre, avatar_url, created_at')
    .order('created_at', { ascending: false })

  const profiles = (profileRows ?? []) as ProfileRow[]

  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 })
  const authMap = new Map<string, string | null>()
  for (const au of authData?.users ?? []) {
    authMap.set(au.id, au.last_sign_in_at ?? null)
  }

  const users: MailingUser[] = profiles.map((p) => ({
    ...p,
    last_sign_in_at: authMap.get(p.id) ?? null,
  }))

  const { data: historyRows } = await db
    .from('admin_mailings')
    .select(
      'id, asunto, recipient_count, sent_count, failed_count, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(20)

  const history = (historyRows ?? []) as MailingHistoryRow[]

  return <MailingsClient users={users} history={history} />
}
