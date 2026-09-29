'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseServerClient } from '@/app/admin/supabase-server'
import { TIPOS_EVENTO_RANKING_EVENTO, FORMATOS_EVENTO, TEXTOS_SOLICITUD } from '@/lib/ranking-contenido'
import { api } from '@/lib/api'
import { formatEventoRango } from '@/app/eventos/lib/format-evento-fecha'

export type RankingPayload = {
  tipo_evento: string
  formato: string
  jugadores_esperados: string
  whatsapp: string
}

export type CreateUserEventoPayload = {
  title: string
  descripcion: string
  field_id: string | null
  fecha: string
  fecha_fin: string
  cupo: number
  cupo_vendido_creador: number | null
  tipo: 'publico' | 'privado'
  imagen_url: string | null
  ranking?: RankingPayload | null
}

export async function createUserEvento(
  payload: CreateUserEventoPayload
): Promise<{ ok: true; id: string } | { error: string }> {
  const supabase = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'no_session' }

  const { data: mods } = await supabase
    .from('team_members')
    .select('team_id, rol_plataforma')
    .eq('user_id', user.id)
    .eq('status', 'activo')

  const modTeamIds = new Set(
    (mods ?? [])
      .filter((m) => {
        const r = (m.rol_plataforma || '').toLowerCase()
        return r === 'founder' || r === 'admin'
      })
      .map((m) => m.team_id as string)
      .filter(Boolean)
  )

  const t = payload.title.trim()
  if (!t) return { error: 'El título es obligatorio.' }
  if (t.length > 100) return { error: 'El título admite máximo 100 caracteres.' }
  const desc = (payload.descripcion || '').trim()
  if (desc.length > 1000) return { error: 'La descripción admite máximo 1000 caracteres.' }

  const cupo = Math.max(0, Math.min(100000, Math.floor(Number(payload.cupo))))
  if (!Number.isFinite(cupo) || cupo < 0) return { error: 'Cupo inválido.' }

  if (payload.cupo_vendido_creador !== null) {
    if (
      !Number.isFinite(payload.cupo_vendido_creador) ||
      payload.cupo_vendido_creador < 0
    ) {
      return { error: 'Lugares vendidos inválido.' }
    }
    if (cupo > 0 && payload.cupo_vendido_creador > cupo) {
      return { error: 'Los lugares vendidos no pueden superar el cupo total.' }
    }
  }

  if (!payload.fecha) return { error: 'Indica fecha y hora.' }
  if (!payload.fecha_fin) return { error: 'Indica la hora de término.' }
  if (
    !Number.isFinite(new Date(payload.fecha_fin).getTime()) ||
    new Date(payload.fecha_fin) <= new Date(payload.fecha)
  ) {
    return { error: 'La hora de término debe ser después del inicio' }
  }

  // Server-side ranking validation (trust boundary)
  if (payload.ranking) {
    const { tipo_evento, formato, jugadores_esperados, whatsapp } = payload.ranking
    const tiposValidos = new Set<string>(TIPOS_EVENTO_RANKING_EVENTO)
    const formatosValidos = new Set<string>(FORMATOS_EVENTO)
    const jugadoresValidos = new Set<string>(TEXTOS_SOLICITUD.jugadoresOpciones)
    if (!tiposValidos.has(tipo_evento)) return { error: 'Tipo de evento inválido.' }
    if (!formatosValidos.has(formato)) return { error: 'Formato inválido.' }
    if (!jugadoresValidos.has(jugadores_esperados)) return { error: 'Jugadores esperados inválido.' }
    const digits = String(whatsapp ?? '').replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 13) return { error: 'WhatsApp inválido.' }
  }

  let fieldId: string | null = payload.field_id?.trim() || null
  let fieldCiudad: string | null = null

  if (payload.tipo === 'privado') {
    if (!fieldId) return { error: 'Elige el campo privado del equipo.' }
    const { data: frow } = await supabase
      .from('fields')
      .select('id, tipo, team_id, status, ciudad')
      .eq('id', fieldId)
      .maybeSingle()
    if (!frow || frow.status !== 'aprobado') return { error: 'Campo no válido.' }
    if ((frow.tipo || '').toLowerCase() !== 'privado') {
      return { error: 'Los eventos privados requieren un campo privado.' }
    }
    if (!frow.team_id || !modTeamIds.has(frow.team_id)) {
      return { error: 'No puedes usar ese campo privado.' }
    }
    fieldCiudad = typeof frow.ciudad === 'string' ? frow.ciudad : null
  } else if (fieldId) {
    const { data: frow } = await supabase
      .from('fields')
      .select('id, tipo, status, ciudad')
      .eq('id', fieldId)
      .maybeSingle()
    if (!frow || frow.status !== 'aprobado') return { error: 'Campo no válido.' }
    if ((frow.tipo || '').toLowerCase() === 'privado') {
      return { error: 'Para un campo privado, el evento debe ser privado.' }
    }
    fieldCiudad = typeof frow.ciudad === 'string' ? frow.ciudad : null
  }

  const cupoVendidoInsert =
    payload.cupo_vendido_creador === null
      ? null
      : Math.floor(payload.cupo_vendido_creador)

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: t.slice(0, 100),
      descripcion: desc ? desc.slice(0, 1000) : null,
      field_id: fieldId,
      fecha: payload.fecha,
      fecha_fin: payload.fecha_fin,
      cupo,
      cupo_vendido_creador: cupoVendidoInsert,
      disciplina: 'airsoft',
      tipo: payload.tipo,
      imagen_url: payload.imagen_url?.trim() || null,
      published: true,
      status: 'publicado',
      organizador_id: user.id,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const id = data?.id as string
  revalidatePath('/eventos')
  revalidatePath(`/eventos/${id}`)

  // Solicitud de ranking: nunca bloquea ni hace fallar la creación del evento.
  if (payload.ranking) {
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('nombre, alias')
        .eq('id', user.id)
        .maybeSingle()
      const nombreRaw = ((userRow?.nombre || userRow?.alias) as string | null | undefined)?.trim() ?? ''
      const nombre = nombreRaw.length >= 2 ? nombreRaw.slice(0, 120) : 'Organizador'

      const organizacion = t.length >= 2 ? t.slice(0, 150) : `Evento ${t}`.slice(0, 150)

      const fechaFormateada = formatEventoRango(payload.fecha, payload.fecha_fin).slice(0, 60)

      const ciudadRaw = fieldCiudad?.trim() ?? ''
      const ciudad = ciudadRaw.length >= 2 ? ciudadRaw : 'Sin especificar'

      const result = await api.ranking.solicitarEvento(
        {
          nombre,
          whatsapp: payload.ranking.whatsapp,
          email: user.email ?? null,
          organizacion,
          tipo_evento: payload.ranking.tipo_evento,
          ciudad,
          jugadores_esperados: payload.ranking.jugadores_esperados,
          fecha_aproximada: fechaFormateada,
          user_id: user.id,
          origen: 'evento',
          event_id: id,
          formato: payload.ranking.formato,
        },
        AbortSignal.timeout(6000)
      )
      if (!result.success) {
        console.error('[createUserEvento] ranking solicitud failed:', result.error)
      }
    } catch (e) {
      console.error('[createUserEvento] ranking solicitud error:', e)
    }
  }

  return { ok: true, id }
}
