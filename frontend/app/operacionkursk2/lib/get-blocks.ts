import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import type { OperacionKursk2Block, OperacionKursk2Slug } from './types'

function normalizeConfig(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw
  }
  return {}
}

export async function getOperacionKursk2Blocks(): Promise<OperacionKursk2Block[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('operacionkursk2_blocks')
    .select('id, slug, config, activo, orden')
    .order('orden', { ascending: true })

  if (error) {
    console.error('[operacionkursk2] error cargando bloques', error.message)
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
    slug: r.slug as OperacionKursk2Slug,
    config: normalizeConfig(r.config),
    activo: Boolean(r.activo),
    orden: Number(r.orden ?? 0),
  }))
}
