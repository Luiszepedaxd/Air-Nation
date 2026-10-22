import 'server-only'
import type { ArenaLandingMedia } from '@/lib/arena-api'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

/** Tarjeta de un campo en la landing /arena (solo columnas públicas). */
export type ArenaLandingCard = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  estado: string | null
  tipo: string | null
  foto_portada_url: string | null
  logo_url: string | null
  promedio_rating: number | string | null
  destacado: boolean
  resumen: string | null
  precio_desde_centavos: number | null
  es_prueba: boolean
}

export type ArenaLanding = {
  fields: ArenaLandingCard[]
  total: number
  filtros: { estados: string[]; ciudades: string[] }
}

/** Filtros que acepta el backend; cualquier otro query param se ignora. */
export const ARENA_FILTROS = [
  'estado',
  'ciudad',
  'precio_max',
  'tipo',
  'dia',
  'jugadores',
  'offset',
] as const

const VACIO: ArenaLanding = { fields: [], total: 0, filtros: { estados: [], ciudades: [] } }

/**
 * Catálogo de la landing, leído del backend (único que puede ver
 * `arena_field_settings`). Manda el token de la sesión cuando existe: así un
 * admin ve también los campos de prueba.
 */
export async function fetchArenaLanding(
  searchParams: Record<string, string | string[] | undefined>
): Promise<ArenaLanding> {
  const qs = new URLSearchParams()
  for (const key of ARENA_FILTROS) {
    const v = searchParams[key]
    const valor = Array.isArray(v) ? v[0] : v
    if (valor) qs.set(key, valor)
  }

  const {
    data: { session },
  } = await createDashboardSupabaseServerClient().auth.getSession()

  try {
    const res = await fetch(`${API_URL}/arena/fields?${qs.toString()}`, {
      cache: 'no-store',
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    })
    if (!res.ok) {
      console.error('[arena] landing:', res.status)
      return VACIO
    }
    return (await res.json()) as ArenaLanding
  } catch (e) {
    console.error('[arena] landing:', (e as Error).message)
    return VACIO
  }
}

/**
 * Hero, banners y promos activos de la landing. Si el backend no responde la
 * landing se muestra sin ellos: son decorado, no contenido crítico.
 */
export async function fetchArenaLandingMedia(): Promise<ArenaLandingMedia[]> {
  try {
    const res = await fetch(`${API_URL}/arena/landing-media`, { cache: 'no-store' })
    if (!res.ok) return []
    const { media } = (await res.json()) as { media?: ArenaLandingMedia[] }
    return media ?? []
  } catch (e) {
    console.error('[arena] landing-media:', (e as Error).message)
    return []
  }
}
