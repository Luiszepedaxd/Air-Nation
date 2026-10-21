/**
 * Único camino del frontend al backend de ARENA (`/api/v1/arena`).
 * Reusa `apiFetch`, que ya agrega el Bearer de la sesión de Supabase; sin
 * sesión la llamada sale como invitado, que es lo que necesita el checkout.
 */
import { apiFetch } from '@/lib/apiFetch'

export class ArenaApiError extends Error {
  code?: string
  detalle?: string
  status: number
  constructor(message: string, status: number, code?: string, detalle?: string) {
    super(message)
    this.name = 'ArenaApiError'
    this.status = status
    this.code = code
    this.detalle = detalle
  }
}

async function parse<T>(res: Response): Promise<T> {
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    throw new ArenaApiError(
      typeof json.error === 'string' ? json.error : `Error ${res.status}`,
      res.status,
      typeof json.code === 'string' ? json.code : undefined,
      typeof json.detalle === 'string' ? json.detalle : undefined
    )
  }
  return json as T
}

export async function arenaGet<T>(path: string): Promise<T> {
  return parse<T>(await apiFetch(`/arena${path}`, { cache: 'no-store' }))
}

export async function arenaSend<T>(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  return parse<T>(
    await apiFetch(`/arena${path}`, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  )
}

/** Sube una foto del catálogo y devuelve su URL pública. */
export async function arenaUploadFoto(fieldId: string, file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const { url } = await parse<{ url: string }>(
    await apiFetch(`/arena/owner/fields/${fieldId}/uploads`, { method: 'POST', body: fd })
  )
  return url
}

export function arenaErrorMessage(err: unknown): string {
  if (err instanceof ArenaApiError) return err.detalle ? `${err.message} (${err.detalle})` : err.message
  if (err instanceof Error && err.message) return err.message
  return 'Algo falló. Intenta de nuevo.'
}

// ─── Tipos que devuelve el backend ──────────────────────────────────────────

export type ArenaPlan = 'free' | 'premium' | 'pro'
export type ArenaItemTipo = 'paquete' | 'derecho_campo' | 'renta' | 'extra'
export type ArenaUnidad = 'por_persona' | 'por_reserva' | 'por_unidad'

export type ArenaSettings = {
  field_id: string
  activo: boolean
  plan: ArenaPlan
  comision_pct: number
  anticipacion_min_horas: number
  anticipacion_max_dias: number
  cancelacion_horas_limite: number
  politica_cancelacion: string | null
  email_avisos: string | null
  telefono_avisos: string | null
  banco: string | null
  clabe: string | null
  titular_cuenta: string | null
}

export type ArenaItem = {
  id: string
  field_id: string
  tipo: ArenaItemTipo
  es_base: boolean
  nombre: string
  descripcion: string | null
  incluye: string[]
  precio_centavos: number
  unidad: ArenaUnidad
  min_jugadores: number | null
  max_jugadores: number | null
  max_por_reserva: number | null
  fotos_urls: string[]
  activo: boolean
  orden: number
}

export type ArenaBlackout = {
  id: string
  fecha: string
  motivo: string | null
  created_at?: string
}

export type ArenaMember = {
  id?: string
  user_id: string
  rol: string
  status: string
  created_at?: string
  nombre?: string | null
  alias?: string | null
  email?: string | null
  usuario?: { id: string; nombre: string | null; alias: string | null; email: string | null } | null
}

export type ArenaAdminField = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  status: string
  arena: ArenaSettings | null
  miembros: ArenaMember[]
  reservas_proximas: number
}

export type ArenaOwnerField = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  status: string
  horarios_json: unknown
  arena: ArenaSettings | null
  reservas_hoy: number
  llegadas_hoy: number
}
