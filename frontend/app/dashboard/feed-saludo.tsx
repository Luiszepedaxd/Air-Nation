import { createDashboardSupabaseServerClient } from './supabase-server'

const jost = { fontFamily: "'Jost', sans-serif" } as const

export function SaludoSkeleton() {
  return (
    <header className="space-y-2">
      <div className="h-8 w-64 max-w-full animate-pulse bg-[#F4F4F4]" />
      <div className="h-4 w-56 max-w-full animate-pulse bg-[#F4F4F4]" />
    </header>
  )
}

export async function SaludoSection() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, alias')
    .eq('id', user.id)
    .maybeSingle()

  const display =
    profile?.alias?.trim() ||
    profile?.nombre?.trim() ||
    'JUGADOR'

  return (
    <header>
      <h1
        style={jost}
        className="font-extrabold text-xl uppercase tracking-tight text-[#111111] leading-tight sm:text-2xl"
      >
        BIENVENIDO, {display}
      </h1>
      <p className="mt-1 text-sm text-[#666666] font-normal">
        Aquí está lo último de la comunidad
      </p>
    </header>
  )
}
