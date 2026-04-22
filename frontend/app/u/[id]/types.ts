export type PublicUserProfile = {
  id: string
  alias: string | null
  nombre: string | null
  ciudad: string | null
  rol: string | null
  avatar_url: string | null
  foto_portada_url: string | null
  bio: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
  facebook: string | null
  member_number: string | number | null
  created_at: string
  perfil_publico: boolean | null
  team_id: string | null
  teams: { id: string; nombre: string; slug: string; logo_url: string | null } | null
  teams_list?: Array<{
    id: string
    nombre: string
    slug: string
    logo_url: string | null
    team_role: string | null
  }>
}

export type PlayerPostRow = {
  id: string
  content: string | null
  fotos_urls: string[] | null
  created_at: string
  video_url?: string | null
  video_duration_s?: number | null
  /** Ids (uuid) de usuarios @mencionados; columna en DB: `mentions` */
  mentions?: string[] | null
  /** Para enlaces @alias → /u/[id] en el cliente */
  mentionAliasById?: Record<string, string> | null
}

export type PlayerEventRow = {
  id: string
  title: string | null
  fecha: string | null
  imagen_url: string | null
  status: string | null
}

export type PublicReplicaRow = {
  id: string
  nombre: string
  sistema: string | null
  mecanismo: string | null
  condicion: string | null
  foto_url: string | null
  verificada: boolean
  ciudad: string | null
  estado: string | null
}
