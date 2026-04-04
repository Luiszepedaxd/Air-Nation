export type ApprovedFieldNotice = {
  id: string
  fecha_deseada: string | null
  created_at: string
  /** Momento de la aprobación (para texto tipo “hace X”) */
  updated_at: string
  field_nombre: string
  field_slug: string
  event_id: string
}
