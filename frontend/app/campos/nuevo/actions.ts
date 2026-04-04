'use server'

import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { generateFieldSlug } from '@/lib/field-slug'
import type { SupabaseClient } from '@supabase/supabase-js'

export type CreateCampoState = { error: string } | null

export type PrepareCampoSlugResult =
  | { ok: true; slug: string }
  | { ok: false; error: string }

/** Resuelve slug único antes de subir archivos y de ejecutar el INSERT. */
export async function prepareCampoSlugAction(
  nombre: string,
  clientBaseSlug: string
): Promise<PrepareCampoSlugResult> {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Debes iniciar sesión.' }
  }

  const n = nombre.trim()
  if (!n) {
    return { ok: false, error: 'Indica el nombre del campo.' }
  }

  try {
    const base = generateFieldSlug(clientBaseSlug || undefined, n)
    const unique = await resolveUniqueFieldSlug(supabase, base)
    return { ok: true, slug: unique }
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : 'No se pudo comprobar el enlace.',
    }
  }
}

async function resolveUniqueFieldSlug(
  supabase: SupabaseClient,
  baseSlug: string
): Promise<string> {
  let candidate = baseSlug
  for (let n = 2; n < 10000; n += 1) {
    const { data: existing, error } = await supabase
      .from('fields')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      console.error('[createCampoAction] slug uniqueness check:', {
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

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export async function createCampoAction(
  _prevState: CreateCampoState,
  formData: FormData
): Promise<CreateCampoState> {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/campos/nuevo')
  }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const ciudad = String(formData.get('ciudad') ?? '').trim()
  const tipoRaw = String(formData.get('tipo') ?? '').toLowerCase()
  const tipo = tipoRaw === 'privado' ? 'privado' : 'publico'
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const horarios = String(formData.get('horarios') ?? '').trim()
  const teamIdRaw = String(formData.get('team_id') ?? '').trim()
  const team_id = teamIdRaw ? teamIdRaw : null

  const lat = parseOptionalNumber(String(formData.get('ubicacion_lat') ?? ''))
  const lng = parseOptionalNumber(String(formData.get('ubicacion_lng') ?? ''))
  const telefono = String(formData.get('telefono') ?? '').trim()
  const instagram = String(formData.get('instagram') ?? '').trim()
  const fotoPortadaUrl = String(formData.get('foto_portada_url') ?? '').trim()
  const rawSlug = String(formData.get('slug') ?? '').trim()

  let galeria_urls: string[] = []
  const galeriaJson = String(formData.get('galeria_urls') ?? '').trim()
  if (galeriaJson) {
    try {
      const parsed = JSON.parse(galeriaJson) as unknown
      if (Array.isArray(parsed)) {
        galeria_urls = parsed.filter((x): x is string => typeof x === 'string')
      }
    } catch {
      return { error: 'Formato de galería inválido.' }
    }
  }
  if (galeria_urls.length > 6) {
    return { error: 'Máximo 6 fotos en la galería.' }
  }

  if (!nombre || nombre.length > 80) {
    return { error: 'El nombre del campo es obligatorio (máx. 80 caracteres).' }
  }
  if (!ciudad) {
    return { error: 'Selecciona una ciudad.' }
  }
  if (descripcion.length > 500) {
    return { error: 'La descripción no puede superar 500 caracteres.' }
  }
  if (horarios.length > 200) {
    return { error: 'Los horarios no pueden superar 200 caracteres.' }
  }

  if (team_id) {
    const { data: member } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .eq('status', 'activo')
      .in('rol_plataforma', ['founder', 'admin'])
      .maybeSingle()

    if (!member) {
      return { error: 'No puedes asociar ese equipo.' }
    }
  }

  let uniqueSlug: string
  try {
    const baseSlug = generateFieldSlug(rawSlug || undefined, nombre)
    uniqueSlug = await resolveUniqueFieldSlug(supabase, baseSlug)
  } catch (e) {
    console.error('[createCampoAction] slug generation:', e)
    return {
      error:
        e instanceof Error ? e.message : 'No se pudo generar la URL del campo.',
    }
  }

  const { data: field, error: insErr } = await supabase
    .from('fields')
    .insert({
      nombre,
      slug: uniqueSlug,
      ciudad,
      tipo,
      descripcion: descripcion || null,
      horarios: horarios || null,
      ubicacion_lat: lat,
      ubicacion_lng: lng,
      telefono: telefono || null,
      instagram: instagram || null,
      foto_portada_url: fotoPortadaUrl || null,
      galeria_urls: galeria_urls.length > 0 ? galeria_urls : null,
      team_id,
      status: 'pendiente',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insErr) {
    console.error('[createCampoAction] fields INSERT:', {
      message: insErr.message,
      code: insErr.code,
      details: insErr.details,
      hint: insErr.hint,
    })
    return { error: insErr.message }
  }

  if (!field?.id) {
    return { error: 'No se pudo registrar el campo.' }
  }

  redirect('/dashboard/perfil?tab=campos&campo_creado=1')
}
