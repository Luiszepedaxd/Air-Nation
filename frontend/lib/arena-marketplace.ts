/**
 * Filtros del marketplace: viven en la URL (`/arena?estado=Jalisco&fecha=…`)
 * para que un link se pueda compartir y para SEO. Aquí solo se traducen a
 * query string y de vuelta; el filtrado lo hace `arena_marketplace` en la BD.
 *
 * No lleva `import 'server-only'` a propósito: el mismo módulo lo usan el SSR
 * de `/arena` (con `fetch`) y el cliente (con `arenaGet`). No toca secretos ni
 * la sesión, porque el marketplace es público.
 */
import type { ArenaLandingMedia, ArenaMarketplace } from '@/lib/arena-api'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

/** Los únicos parámetros que acepta el backend; cualquier otro se ignora. */
export const ARENA_FILTROS = [
  'fecha',
  'estado',
  'ciudad',
  'jugadores',
  'disciplina',
  'terreno',
  'precio_max',
  'con_renta',
  'rating_min',
  'orden',
] as const

export type ArenaFiltroKey = (typeof ARENA_FILTROS)[number]
export type ArenaFiltrosValor = Partial<Record<ArenaFiltroKey, string>>

/** Precio máximo del slider, en centavos. Ese tope = "sin límite". */
export const PRECIO_MIN_CENTAVOS = 15000
export const PRECIO_MAX_CENTAVOS = 50000

export const VACIO: ArenaMarketplace = {
  campos: [],
  total: 0,
  filtros: { estados: [] },
  reservas_habilitadas: false,
  hoy: '',
}

/** `searchParams` de Next → filtros limpios (sin claves vacías). */
export function filtrosDeSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): ArenaFiltrosValor {
  const out: ArenaFiltrosValor = {}
  for (const key of ARENA_FILTROS) {
    const raw = searchParams[key]
    const valor = (Array.isArray(raw) ? raw[0] : raw)?.trim()
    if (valor) out[key] = valor
  }
  return out
}

export function filtrosAQuery(filtros: ArenaFiltrosValor): string {
  const qs = new URLSearchParams()
  for (const key of ARENA_FILTROS) {
    const v = filtros[key]
    if (v) qs.set(key, v)
  }
  return qs.toString()
}

export function urlDeFiltros(filtros: ArenaFiltrosValor): string {
  const qs = filtrosAQuery(filtros)
  return qs ? `/arena?${qs}` : '/arena'
}

/** Filtros que cuentan para el badge y los chips de la hoja de filtros. */
export function filtrosActivos(filtros: ArenaFiltrosValor): ArenaFiltroKey[] {
  return ARENA_FILTROS.filter((k) => k !== 'orden' && Boolean(filtros[k]))
}

/**
 * Catálogo del marketplace desde el servidor. Si el backend no responde, la
 * landing se muestra vacía con su estado vacío en lugar de romperse.
 */
export async function fetchArenaMarketplace(
  filtros: ArenaFiltrosValor
): Promise<ArenaMarketplace> {
  const qs = filtrosAQuery(filtros)
  try {
    const res = await fetch(`${API_URL}/arena/marketplace${qs ? `?${qs}` : ''}`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('[arena] marketplace:', res.status)
      return VACIO
    }
    return (await res.json()) as ArenaMarketplace
  } catch (e) {
    console.error('[arena] marketplace:', (e as Error).message)
    return VACIO
  }
}

/**
 * Hero, banners y promos que administra /admin/arena/landing. Si el backend no
 * responde la landing se ve sin ellos: son decorado, no contenido crítico.
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
