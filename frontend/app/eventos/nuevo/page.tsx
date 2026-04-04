import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createAdminSupabaseServerClient } from '@/app/admin/supabase-server'
import { EventoNuevoForm, type NuevoFieldOption } from './EventoNuevoForm'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Nuevo evento — AirNation',
  description: 'Crea un evento público o privado en la comunidad.',
}

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const lato = { fontFamily: "'Lato', sans-serif" }

function mapFieldRows(
  rows: { id: string; nombre: string | null; ciudad: string | null }[] | null
): NuevoFieldOption[] {
  return (rows ?? []).map((r) => ({
    id: r.id,
    nombre: r.nombre ?? 'Campo',
    ciudad: r.ciudad ?? null,
  }))
}

function firstSearchParam(
  v: string | string[] | undefined
): string | undefined {
  if (v == null) return undefined
  return Array.isArray(v) ? v[0] : v
}

export default async function EventoNuevoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const supabase = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/eventos/nuevo')
  }

  const { data: mods } = await supabase
    .from('team_members')
    .select('team_id, rol_plataforma')
    .eq('user_id', user.id)
    .eq('status', 'activo')

  const modTeamIds = Array.from(
    new Set(
      (mods ?? [])
        .filter((m) => {
          const r = (m.rol_plataforma || '').toLowerCase()
          return r === 'founder' || r === 'admin'
        })
        .map((m) => m.team_id as string)
        .filter(Boolean)
    )
  )

  const { data: pubRows } = await supabase
    .from('fields')
    .select('id, nombre, ciudad, tipo')
    .eq('status', 'aprobado')
    .or('tipo.eq.publico,tipo.is.null')

  const publicFields = mapFieldRows(pubRows ?? [])

  let privateFields: NuevoFieldOption[] = []
  if (modTeamIds.length > 0) {
    const { data: privRows } = await supabase
      .from('fields')
      .select('id, nombre, ciudad')
      .eq('status', 'aprobado')
      .eq('tipo', 'privado')
      .in('team_id', modTeamIds)
    privateFields = mapFieldRows(privRows ?? [])
  }

  const canCreatePrivate = privateFields.length > 0

  const rawFieldId = firstSearchParam(searchParams.field_id)?.trim()
  let lockedField: { id: string; nombre: string } | null = null
  if (rawFieldId) {
    const match = publicFields.find((f) => f.id === rawFieldId)
    if (match) {
      lockedField = { id: match.id, nombre: match.nombre }
    }
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[960px] md:px-6">
          <h1
            className="text-2xl font-extrabold uppercase leading-tight text-white"
            style={{ ...jostHeading, fontWeight: 800 }}
          >
            NUEVO EVENTO
          </h1>
          <p className="mt-2 text-sm text-[#999999]" style={lato}>
            Tu evento se publicará de inmediato en la comunidad.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[960px] px-4 py-8 md:px-6">
        <EventoNuevoForm
          publicFields={publicFields}
          privateFields={privateFields}
          canCreatePrivate={canCreatePrivate}
          lockedField={lockedField}
        />
      </div>
    </div>
  )
}
