'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/app/admin/supabase-server'
import { requireAppAdminUserId } from '@/app/admin/require-app-admin'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { generateFieldSlug } from '@/lib/field-slug'
import type { SupabaseClient } from '@supabase/supabase-js'

export type CreateCampoState = { error: string } | null

export type PrepareCampoSlugResult =
  | { ok: true; slug: string }
  | { ok: false; error: string }

/** Resuelve slug único con service role (formulario admin). */
export async function prepareCampoSlugAdminAction(
  nombre: string,
  clientBaseSlug: string
): Promise<PrepareCampoSlugResult> {
  const adminId = await requireAppAdminUserId()
  if (!adminId) {
    return { ok: false, error: 'No autorizado.' }
  }

  const n = nombre.trim()
  if (!n) {
    return { ok: false, error: 'Indica el nombre del campo.' }
  }

  try {
    const db = createAdminClient()
    const base = generateFieldSlug(clientBaseSlug || undefined, n)
    const unique = await resolveUniqueFieldSlug(db, base)
    return { ok: true, slug: unique }
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : 'No se pudo comprobar el enlace.',
    }
  }
}

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

export async function createCampoAction(
  _prevState: CreateCampoState,
  formData: FormData
): Promise<CreateCampoState> {
  const adminContext = String(formData.get('admin_context') ?? '') === '1'

  const nombre = String(formData.get('nombre') ?? '').trim()
  const ciudad = String(formData.get('ciudad') ?? '').trim()
  const estado = String(formData.get('estado') ?? '').trim()
  const tipoRaw = String(formData.get('tipo') ?? '').toLowerCase()
  const tipo = tipoRaw === 'privado' ? 'privado' : 'publico'
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const teamIdRaw = String(formData.get('team_id') ?? '').trim()
  const team_id = teamIdRaw ? teamIdRaw : null

  const direccion = String(formData.get('direccion') ?? '').trim()
  const maps_url = String(formData.get('maps_url') ?? '').trim()
  const logo_url = String(formData.get('logo_url') ?? '').trim()
  const telefono = String(formData.get('telefono') ?? '').trim()
  const instagram = String(formData.get('instagram') ?? '').trim()
  const fotoPortadaUrl = String(formData.get('foto_portada_url') ?? '').trim()

  let horarios_json: Record<string, unknown> | null = null
  const hjRaw = String(formData.get('horarios_json') ?? '').trim()
  if (hjRaw) {
    try {
      const p = JSON.parse(hjRaw) as unknown
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        horarios_json = p as Record<string, unknown>
      } else {
        return { error: 'Formato de horarios inválido.' }
      }
    } catch {
      return { error: 'Formato de horarios inválido.' }
    }
  }
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
  if (direccion.length > 300) {
    return { error: 'La dirección no puede superar 300 caracteres.' }
  }
  if (maps_url.length > 2000) {
    return { error: 'El enlace de mapas es demasiado largo.' }
  }

  if (adminContext) {
    const adminId = await requireAppAdminUserId()
    if (!adminId) {
      return { error: 'No autorizado.' }
    }

    const db = createAdminClient()

    if (team_id) {
      const { data: t } = await db
        .from('teams')
        .select('id')
        .eq('id', team_id)
        .maybeSingle()
      if (!t) {
        return { error: 'Equipo no válido.' }
      }
    }

    let uniqueSlug: string
    try {
      const baseSlug = generateFieldSlug(rawSlug || undefined, nombre)
      uniqueSlug = await resolveUniqueFieldSlug(db, baseSlug)
    } catch (e) {
      console.error('[createCampoAction] slug generation (admin):', e)
      return {
        error:
          e instanceof Error
            ? e.message
            : 'No se pudo generar la URL del campo.',
      }
    }

    const { data: field, error: insErr } = await db
      .from('fields')
      .insert({
        nombre,
        slug: uniqueSlug,
        ciudad,
        estado: estado || null,
        tipo,
        descripcion: descripcion || null,
        direccion: direccion || null,
        maps_url: maps_url || null,
        logo_url: logo_url || null,
        horarios_json: horarios_json,
        telefono: telefono || null,
        instagram: instagram || null,
        foto_portada_url: fotoPortadaUrl || null,
        galeria_urls: galeria_urls.length > 0 ? galeria_urls : null,
        team_id,
        status: 'aprobado',
        created_by: adminId,
      })
      .select('id')
      .single()

    if (insErr) {
      console.error('[createCampoAction] fields INSERT (admin):', insErr)
      return { error: insErr.message }
    }

    if (!field?.id) {
      return { error: 'No se pudo registrar el campo.' }
    }

    redirect('/admin/campos')
  }

  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/campos/nuevo')
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
      estado: estado || null,
      tipo,
      descripcion: descripcion || null,
      direccion: direccion || null,
      maps_url: maps_url || null,
      logo_url: logo_url || null,
      horarios_json: horarios_json,
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
