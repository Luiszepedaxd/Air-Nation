import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { logosParaLanding, type CatalogSponsor } from './sponsors'
import type { Biohazard2Block, Biohazard2Slug, SponsorsConfig } from './types'

function normalizeConfig(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw
  }
  return {}
}

export async function getBiohazard2Blocks(): Promise<Biohazard2Block[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('biohazard2_blocks')
    .select('id, slug, config, activo, orden')
    .order('orden', { ascending: true })

  if (error) {
    console.error('[biohazard2] error cargando bloques', error.message)
    return []
  }

  const rows = (data ?? []) as {
    id: string
    slug: string
    config: unknown
    activo: unknown
    orden: unknown
  }[]

  const catalog = rows.some((r) => r.slug === 'sponsors')
    ? await catalogoSponsorsActivos(supabase)
    : null

  return rows.map((r) => {
    const config = normalizeConfig(r.config)
    return {
      id: String(r.id),
      slug: r.slug as Biohazard2Slug,
      config:
        r.slug === 'sponsors'
          ? {
              ...(config as SponsorsConfig),
              logos: logosParaLanding((config as SponsorsConfig).logos, catalog),
            }
          : config,
      activo: Boolean(r.activo),
      orden: Number(r.orden ?? 0),
    }
  })
}

async function catalogoSponsorsActivos(
  supabase: ReturnType<typeof createPublicSupabaseClient>
): Promise<CatalogSponsor[] | null> {
  const { data, error } = await supabase
    .from('sponsors')
    .select('id, nombre, logo_url, link')
    .eq('activo', true)
    .order('orden', { ascending: true })

  if (error) {
    console.error('[biohazard2] sponsors', error.message)
    return null
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    nombre: String(row.nombre ?? ''),
    logo_url: String(row.logo_url ?? ''),
    link: String(row.link ?? ''),
  }))
}
