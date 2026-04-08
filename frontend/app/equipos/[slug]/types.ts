export type PublicTeam = {
  id: string
  nombre: string
  slug: string
  /** Dueño del equipo (teams.created_by) */
  created_by?: string | null
  ciudad: string | null
  descripcion: string | null
  historia: string | null
  foto_portada_url: string | null
  logo_url: string | null
  /** Opcional: galería en `teams` si existe la columna en Supabase */
  galeria_urls: string[] | null
  instagram: string | null
  facebook: string | null
  whatsapp_url: string | null
  created_at: string
}

export type MemberDisplay = {
  id: string
  user_id: string
  rol_plataforma: string | null
  rango_militar: string | null
  nombre: string | null
  alias: string | null
  avatar_url: string | null
  /** Ordenación: `team_members.created_at` */
  created_at: string
}

export type TeamPostRow = {
  id: string
  content: string | null
  fotos_urls: string[] | null
  created_at: string
  created_by?: string | null
}

/** URLs de fotos desde la columna `fotos_urls` (TEXT[]) de `team_albums`. */
export type AlbumWithPhotos = {
  id: string
  nombre: string
  created_at: string
  fotos_urls: string[]
}

export type TeamEventoUpcomingRow = {
  id: string
  title: string
  fecha: string
  imagen_url: string | null
  field_foto: string | null
  cupo: number
  tipo: string | null
  field_nombre: string | null
  field_slug: string | null
  rsvp_count: number
}

export type TeamEventoPastRow = {
  id: string
  title: string
  fecha: string
  imagen_url: string | null
  field_foto: string | null
  field_nombre: string | null
  field_slug: string | null
  cupo: number
}
