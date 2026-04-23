import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import type { BloodMoney2Block, BloodMoney2Slug } from '../types'
import { BM2_SLUGS } from '../types'

function normalizeConfig(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

export async function getBloodMoney2Blocks(): Promise<BloodMoney2Block[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('bloodmoney2_blocks')
    .select('id, slug, config, activo, orden')
    .order('orden', { ascending: true })

  if (error) {
    console.error('[bloodmoney2] blocks:', error.message)
    return []
  }

  const rows = (data ?? []) as {
    id: string
    slug: string
    config: unknown
    activo: unknown
    orden: unknown
  }[]

  return rows
    .filter((r) => (BM2_SLUGS as readonly string[]).includes(r.slug))
    .map((r) => ({
      id: String(r.id),
      slug: r.slug as BloodMoney2Slug,
      config: normalizeConfig(r.config),
      activo: Boolean(r.activo),
      orden: Number(r.orden ?? 0),
    }))
}

export function getHeroConfig(
  blocks: BloodMoney2Block[]
): Record<string, unknown> {
  const hero = blocks.find((b) => b.slug === 'hero')
  return hero?.config ?? {}
}
