export type CampoListRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  tipo: string | null
  foto_portada_url: string | null
  disciplinas: unknown
  promedio_rating: number | string | null
  destacado: boolean
  orden_destacado: number | null
}

export type CampoDetailRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  tipo: string | null
  foto_portada_url: string | null
  disciplinas: unknown
  promedio_rating: number | string | null
  destacado: boolean
  orden_destacado: number | null
  descripcion: string | null
  horarios: unknown
  telefono: string | null
  instagram: string | null
  ubicacion_lat: number | string | null
  ubicacion_lng: number | string | null
  team_id: string | null
  status: string
  teams: {
    nombre: string
    slug: string
    logo_url: string | null
  } | null
}

export type FieldReviewPublic = {
  user_id: string
  rating: number
  comentario: string | null
  created_at: string
  users: {
    nombre: string | null
    alias: string | null
    avatar_url: string | null
  } | null
}
