import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import type { MontanaDeNieblaBlock, MontanaDeNieblaSlug } from './types'

function normalizeConfig(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw
  }
  return {}
}

export async function getMontanaDeNieblaBlocks(): Promise<MontanaDeNieblaBlock[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('montanadeniebla_blocks')
    .select('id, slug, config, activo, orden')
    .order('orden', { ascending: true })

  if (error) {
    console.error('[montanadeniebla] error cargando bloques', error.message)
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
    slug: r.slug as MontanaDeNieblaSlug,
    config: normalizeConfig(r.config),
    activo: Boolean(r.activo),
    orden: Number(r.orden ?? 0),
  }))
}
