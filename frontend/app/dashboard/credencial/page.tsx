import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '../supabase-server'
import { CredencialClient } from '@/components/credential/CredencialClient'
import type { CredentialUserData } from '@/components/credential/CredentialCard'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type UserRowWithTeam = {
  id: string
  nombre: string | null
  alias: string | null
  ciudad: string | null
  rol: string | null
  avatar_url: string | null
  member_number: string | number | null
  created_at: string
  teams: { nombre: string } | { nombre: string }[] | null
}

export default async function CredencialPage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    console.error('[credencial] NO SESSION', { session })
    redirect('/login')
  }

  const { data: row, error } = await supabase
    .from('users')
    .select(
      'id, nombre, alias, ciudad, rol, avatar_url, member_number, created_at, teams(nombre)'
    )
    .eq('id', session.user.id)
    .maybeSingle()

  if (error || !row) {
    console.error('[credencial] QUERY FAILED', {
      error,
      row,
      userId: session.user.id,
    })
    redirect('/dashboard')
  }

  const r = row as UserRowWithTeam
  let teamNombre: string | null = null
  if (r.teams) {
    teamNombre = Array.isArray(r.teams) ? r.teams[0]?.nombre ?? null : r.teams.nombre
  }

  const data: CredentialUserData = {
    id: r.id,
    nombre: r.nombre,
    alias: r.alias,
    ciudad: r.ciudad,
    rol: r.rol,
    avatar_url: r.avatar_url,
    member_number: r.member_number,
    created_at: r.created_at,
    teamNombre,
  }

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <h1
        style={jost}
        className="text-[24px] font-extrabold uppercase leading-tight text-[#111111]"
      >
        MI CREDENCIAL
      </h1>
      <p style={lato} className="mt-2 text-[14px] leading-relaxed text-[#666666]">
        Tu identificación digital AirNation
      </p>
      <CredencialClient data={data} />
    </main>
  )
}
