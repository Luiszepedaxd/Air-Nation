import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import type { Virus3Block, Virus3Slug } from './types'

function normalizeConfig(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw
  }
  return {}
}

export async function getVirus3Blocks(): Promise<Virus3Block[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('virus3_blocks')
    .select('id, slug, config, activo, orden')
    .order('orden', { ascending: true })

  if (error) {
    console.error('[virus3] error cargando bloques', error.message)
    return []
  }

  const rows = (data ?? []) as {
    id: string
    slug: string
    config: unknown
    activo: unknown
    orden: unknown
  }[]

  return rows.map((r) => ({
    id: String(r.id),
    slug: r.slug as Virus3Slug,
    config: normalizeConfig(r.config),
    activo: Boolean(r.activo),
    orden: Number(r.orden ?? 0),
  }))
}
