export type PendingFieldOwnerRequest = {
  id: string
  field_id: string
  fecha_deseada: string | null
  num_jugadores: number | null
  created_at: string
  field_nombre: string
  solicitante_nombre: string | null
  solicitante_alias: string | null
}
