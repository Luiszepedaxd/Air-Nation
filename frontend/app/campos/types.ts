export type CampoListRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  tipo: string | null
  foto_portada_url: string | null
  logo_url: string | null
  promedio_rating: number | string | null
  destacado: boolean
  orden_destacado: number | null
}

export type CampoDetailRow = {
  id: string
  created_by: string | null
  nombre: string
  slug: string
  ciudad: string | null
  tipo: string | null
  foto_portada_url: string | null
  logo_url: string | null
  promedio_rating: number | string | null
  destacado: boolean
  orden_destacado: number | null
  descripcion: string | null
  horarios_json: unknown
  telefono: string | null
  instagram: string | null
  direccion: string | null
  maps_url: string | null
  team_id: string | null
  status: string
  galeria_urls: string[] | null
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
