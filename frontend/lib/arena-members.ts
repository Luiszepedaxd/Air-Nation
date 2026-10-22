import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import type { ArenaOwnerField } from '@/lib/arena-api'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

/**
 * Los campos de ARENA los sube el admin, así que el dueño real casi nunca es
 * `fields.created_by`: la relación vive en `arena_field_members`, que no tiene
 * política de lectura pública.
 *
 * El backend es el único que la consulta (`GET /arena/owner/fields` =
 * requireAuth + `arena_is_field_member`), así que el frontend no necesita —
 * ni debe tener — la llave de servicio. Solo para Server Components: el token
 * sale de la cookie de sesión.
 *
 * Si el backend no responde devuelve vacío: sin permiso, que es el lado
 * seguro de fallar.
 */
export async function arenaOwnerFields(
  accessToken?: string
): Promise<ArenaOwnerField[]> {
  // En `/auth/callback` la sesión recién creada todavía no vive en la cookie
  // de la request, así que el token se pasa a mano.
  let token = accessToken
  if (!token) {
    const {
      data: { session },
    } = await createDashboardSupabaseServerClient().auth.getSession()
    token = session?.access_token
  }
  if (!token) return []

  try {
    const res = await fetch(`${API_URL}/arena/owner/fields`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error('[arena] owner/fields:', res.status)
      return []
    }
    const { fields } = (await res.json()) as { fields?: ArenaOwnerField[] }
    return fields ?? []
  } catch (e) {
    console.error('[arena] owner/fields:', (e as Error).message)
    return []
  }
}

export async function arenaMemberFieldIds(
  accessToken?: string
): Promise<string[]> {
  return (await arenaOwnerFields(accessToken)).map((f) => String(f.id))
}

export async function isArenaFieldMember(fieldId: string): Promise<boolean> {
  if (!fieldId) return false
  return (await arenaMemberFieldIds()).includes(fieldId)
}

/** ¿Puede operar el campo? Creador legacy, miembro activo o admin de app. */
export async function puedeOperarCampo(
  fieldId: string,
  userId: string | null | undefined,
  createdBy: string | null | undefined,
  appRole?: string | null
): Promise<boolean> {
  if (!userId || !fieldId) return false
  if (createdBy && createdBy === userId) return true
  if (appRole === 'admin') return true
  return isArenaFieldMember(fieldId)
}
