import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { arenaOwnerFields } from '@/lib/arena-members'

export const revalidate = 0
export const metadata = { robots: { index: false, follow: false } }

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/**
 * Home del portal del dueño: la puerta de entrada tras el login. Con un solo
 * campo no hay nada que elegir, así que entra directo a su panel.
 */
export default async function MiCampoHomePage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent('/mi-campo')}`)

  const fields = await arenaOwnerFields()
  if (fields.length === 0) redirect('/dashboard/perfil')
  if (fields.length === 1) redirect(`/mi-campo/${fields[0].id}/arena`)

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-8 md:px-6" style={lato}>
      <h1 style={jost} className="text-[22px] leading-tight text-[#111111] md:text-[26px]">
        MIS CAMPOS
      </h1>
      <p className="mt-2 text-[13px] text-[#666666]">
        Elige el campo que vas a operar hoy.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {fields.map((f) => (
          <li key={f.id}>
            <Link
              href={`/mi-campo/${f.id}/arena`}
              className="flex min-h-[72px] flex-col justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 hover:border-[#CC4B37]"
            >
              <span style={jost} className="text-[14px] tracking-[0.06em] text-[#111111]">
                {f.nombre}
              </span>
              <span className="mt-1 text-[12px] text-[#666666]">
                {f.ciudad ? `${f.ciudad} · ` : ''}
                {f.arena?.activo ? 'ARENA activo' : 'ARENA inactivo'} ·{' '}
                {f.reservas_hoy} reservas hoy, {f.llegadas_hoy} llegadas
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
