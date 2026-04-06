import { createAdminClient } from '../supabase-server'
import TeamsList, { type TeamListItem } from './TeamsList'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminEquiposPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('teams')
    .select('id, nombre, ciudad, status, created_at')
    .order('created_at', { ascending: false })

  const teams: TeamListItem[] =
    !error && data ? (data as TeamListItem[]) : []

  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        EQUIPOS
      </h1>
      <TeamsList teams={teams} />
    </div>
  )
}
