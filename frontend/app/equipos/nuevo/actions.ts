'use server'

import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { generateTeamSlug } from '@/lib/team-slug'
import type { SupabaseClient } from '@supabase/supabase-js'

export type CreateTeamState = { error: string } | null

async function resolveUniqueTeamSlug(
  supabase: SupabaseClient,
  baseSlug: string
): Promise<string> {
  let candidate = baseSlug
  for (let n = 2; n < 10000; n += 1) {
    const { data: existing, error } = await supabase
      .from('teams')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      console.error('[createTeamAction] slug uniqueness check:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      throw new Error(error.message)
    }
    if (!existing) return candidate
    candidate = `${baseSlug}-${n}`
  }
  throw new Error('No se pudo generar un slug único')
}

export async function createTeamAction(
  _prevState: CreateTeamState,
  formData: FormData
): Promise<CreateTeamState> {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/equipos/nuevo')
  }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const ciudad = String(formData.get('ciudad') ?? '').trim()
  const rawSlug = String(formData.get('slug') ?? '').trim()

  if (nombre.length < 2 || ciudad.length < 2) {
    return {
      error: 'Nombre y ciudad (mínimo 2 caracteres) son obligatorios.',
    }
  }

  let uniqueSlug: string
  try {
    const baseSlug = generateTeamSlug(rawSlug || undefined, nombre)
    uniqueSlug = await resolveUniqueTeamSlug(supabase, baseSlug)
  } catch (e) {
    console.error('[createTeamAction] slug generation:', e)
    return {
      error:
        e instanceof Error ? e.message : 'No se pudo generar la URL del equipo.',
    }
  }

  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({
      nombre,
      ciudad,
      created_by: user.id,
      slug: uniqueSlug,
      status: 'activo',
    })
    .select()
    .single()

  if (teamErr) {
    console.error('[createTeamAction] teams INSERT:', {
      message: teamErr.message,
      code: teamErr.code,
      details: teamErr.details,
      hint: teamErr.hint,
    })
    return { error: teamErr.message }
  }

  if (!team?.id) {
    return { error: 'No se pudo crear el equipo.' }
  }

  const { error: memberErr } = await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    rol_plataforma: 'founder',
    rango_militar: 'fundador',
    status: 'activo',
  })

  if (memberErr) {
    console.error('[createTeamAction] team_members INSERT:', {
      message: memberErr.message,
      code: memberErr.code,
      details: memberErr.details,
      hint: memberErr.hint,
      team_id: team.id,
      user_id: user.id,
    })
  }

  redirect(`/equipos/${encodeURIComponent(team.slug)}`)
}
