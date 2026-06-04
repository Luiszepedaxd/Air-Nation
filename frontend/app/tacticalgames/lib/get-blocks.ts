import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import type { TacticalGamesBlock, TacticalGamesSlug } from './types'

function normalizeConfig(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw
  }
  return {}
}

export async function getTacticalGamesBlocks(): Promise<TacticalGamesBlock[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('tacticalgames_blocks')
    .select('id, slug, config, activo, orden')
    .order('orden', { ascending: true })

  if (error) {
    console.error('[tacticalgames] error cargando bloques', error.message)
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
    slug: r.slug as TacticalGamesSlug,
    config: normalizeConfig(r.config),
    activo: Boolean(r.activo),
    orden: Number(r.orden ?? 0),
  }))
}
