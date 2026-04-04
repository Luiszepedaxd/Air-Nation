export type TeamJoinRequestAdminRow = {
  id: string
  team_id: string
  user_id: string
  mensaje: string | null
  created_at: string
  nombre: string | null
  alias: string | null
  avatar_url: string | null
  ciudad: string | null
}

export type TeamMemberAdminRow = {
  id: string
  user_id: string
  rol_plataforma: string | null
  rango_militar: string | null
  nombre: string | null
  alias: string | null
  avatar_url: string | null
  ciudad: string | null
}

export type TeamPostAdminRow = {
  id: string
  content: string | null
  fotos_urls: string[] | null
  created_at: string
  created_by: string | null
}

export type TeamAlbumAdminRow = {
  id: string
  nombre: string | null
  fotos_urls: string[] | null
  created_at: string
}
