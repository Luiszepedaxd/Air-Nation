import type { ArenaFichaPublica } from '@/lib/arena-api'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

/**
 * Ficha ARENA de un campo, leída del backend desde el servidor.
 * `arena_field_settings` no tiene lectura pública, así que el SSR no puede
 * consultarla con la llave anónima: el backend es el único camino.
 * Devuelve null si el campo no existe o si ARENA no está activo.
 */
export async function fetchArenaFicha(slug: string): Promise<ArenaFichaPublica | null> {
  try {
    const res = await fetch(`${API_URL}/arena/fields/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as ArenaFichaPublica
  } catch {
    // La ficha del campo no depende de ARENA: si el backend no responde, se
    // muestra igual, solo sin el botón RESERVAR.
    return null
  }
}

/** true si el campo acepta reservas en línea ahora mismo. */
export function aceptaReservas(ficha: ArenaFichaPublica | null): boolean {
  return Boolean(ficha?.arena?.activo && ficha.arena.reservas_habilitadas)
}
