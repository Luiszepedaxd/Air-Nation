export type PublicTeam = {
  id: string
  nombre: string
  slug: string
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
}

export type TeamPostRow = {
  id: string
  title: string | null
  content: string | null
  foto_url: string | null
  created_at: string
}

/** URLs de fotos desde la columna `fotos_urls` (TEXT[]) de `team_albums`. */
export type AlbumWithPhotos = {
  id: string
  nombre: string
  created_at: string
  fotos_urls: string[]
}
