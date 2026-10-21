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

export type ArenaBookingStatus =
  | 'pendiente_pago'
  | 'confirmada'
  | 'completada'
  | 'cancelada'
  | 'no_show'
  | 'expirada'

export type ArenaPagoStatus =
  | 'pendiente'
  | 'pagado'
  | 'fallido'
  | 'reembolsado'
  | 'reembolso_parcial'

export type ArenaBookingItem = {
  nombre: string
  tipo: string
  unidad: string
  cantidad: number
  precio_unit_centavos: number
  subtotal_centavos: number
}

/** Renglón de la agenda del dueño. */
export type ArenaAgendaBooking = {
  id: string
  codigo: string
  fecha: string
  num_jugadores: number
  jugadores_llegaron: number | null
  status: ArenaBookingStatus
  pago_status: ArenaPagoStatus
  total_centavos: number
  comision_centavos: number
  monto_campo_centavos: number
  reembolso_centavos: number
  contacto_nombre: string
  contacto_email: string
  contacto_telefono: string | null
  notas_jugador: string | null
  notas_internas: string | null
  origen: string
  checkin_at: string | null
  cancelada_por: string | null
  motivo_cancelacion: string | null
  expires_at: string | null
  created_at: string
  qr_token: string | null
  items: ArenaBookingItem[]
}

export type ArenaAgenda = {
  reservas: ArenaAgendaBooking[]
  desde: string
  hasta: string
  hoy: string
  esperados: number
  llegaron: number
}

/** Reserva como la ve el jugador (y la pantalla de confirmación). */
export type ArenaReserva = {
  codigo: string
  fecha: string
  num_jugadores: number
  jugadores_llegaron: number | null
  status: ArenaBookingStatus
  pago_status: ArenaPagoStatus
  origen: string
  contacto_nombre: string
  contacto_email: string
  contacto_telefono: string | null
  notas_jugador: string | null
  subtotal_centavos: number
  total_centavos: number
  reembolso_centavos: number
  expires_at: string | null
  checkin_at: string | null
  cancelada_at: string | null
  cancelada_por: string | null
  motivo_cancelacion: string | null
  created_at: string
  items: ArenaBookingItem[]
  campo: {
    id: string
    nombre: string
    slug: string
    ciudad: string | null
    direccion: string | null
    maps_url: string | null
    foto_portada_url: string | null
    telefono: string | null
  } | null
  politica_cancelacion: string | null
  cancelacion_horas_limite: number
  limite_cancelacion: string
  cancelable: boolean
  pago_pendiente: { id: string; provider: string; checkout_url: string | null } | null
  qr_token?: string
  qr_url?: string
}

export type ArenaPayout = {
  id: string
  periodo_desde: string
  periodo_hasta: string
  reservas_count: number
  bruto_centavos: number
  comision_centavos: number
  reembolsos_centavos: number
  neto_centavos: number
  status: 'pendiente' | 'transferido'
  referencia: string | null
  transferido_at: string | null
  created_at: string
}

export type ArenaSaldos = {
  saldos: {
    vendido_centavos: number
    comision_centavos: number
    reembolsado_centavos: number
    por_liquidar_centavos: number
    liquidado_centavos: number
    reservas_por_liquidar: number
  }
  liquidaciones: ArenaPayout[]
  hoy: string
}

export type ArenaCheckinPreview = {
  reserva: {
    codigo: string
    fecha: string
    num_jugadores: number
    jugadores_llegaron: number | null
    status: ArenaBookingStatus
    pago_status: ArenaPagoStatus
    total_centavos: number
    contacto_nombre: string
    contacto_telefono: string | null
    notas_jugador: string | null
    checkin_at: string | null
    items: { nombre: string; tipo: string; unidad: string; cantidad: number; subtotal_centavos: number }[]
    campo: { id: string; nombre: string; slug: string } | null
  }
  hoy: string
}

export type ArenaFichaPublica = {
  field: {
    id: string
    nombre: string
    slug: string
    ciudad: string | null
    direccion: string | null
    maps_url: string | null
    foto_portada_url: string | null
    horarios_json: unknown
  }
  arena: {
    activo: boolean
    politica_cancelacion: string | null
    cancelacion_horas_limite: number
    anticipacion_min_horas: number
    anticipacion_max_dias: number
    reservas_habilitadas: boolean
  }
  items: ArenaItem[]
}

export type ArenaOpenDay = { fecha: string; apertura: string; cierre: string }

export type ArenaAdminBooking = {
  id: string
  codigo: string
  field_id: string
  fecha: string
  num_jugadores: number
  status: ArenaBookingStatus
  pago_status: ArenaPagoStatus
  total_centavos: number
  comision_centavos: number
  monto_campo_centavos: number
  reembolso_centavos: number
  payout_id: string | null
  origen: string
  contacto_nombre: string
  contacto_email: string
  created_at: string
  campo: { id: string; nombre: string; slug: string } | null
  pago: {
    provider: string
    provider_ref: string
    status: string
    monto_centavos: number
    created_at: string
  } | null
}

export type ArenaPayoutPendiente = {
  field_id: string
  reservas: number
  bruto_centavos: number
  comision_centavos: number
  reembolsos_centavos: number
  neto_centavos: number
  desde: string
  hasta: string
  campo: { id: string; nombre: string; slug: string } | null
  banco: { banco: string | null; clabe: string | null; titular_cuenta: string | null } | null
}

export type ArenaPayoutAdmin = ArenaPayout & {
  field_id: string
  campo: { id: string; nombre: string; slug: string } | null
  banco: { banco: string | null; clabe: string | null; titular_cuenta: string | null } | null
}
