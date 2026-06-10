export type Virus3Slug =
  | 'hero'
  | 'narrativa'
  | 'sede'
  | 'countdown'
  | 'facciones'
  | 'inscripcion'
  | 'amenidades'
  | 'cronograma'
  | 'sponsors'
  | 'galeria'
  | 'videos'
  | 'musica'
  | 'airnation'

export const VIRUS3_SLUGS: readonly Virus3Slug[] = [
  'hero',
  'narrativa',
  'sede',
  'countdown',
  'facciones',
  'inscripcion',
  'amenidades',
  'cronograma',
  'sponsors',
  'galeria',
  'videos',
  'musica',
  'airnation',
] as const

export type HeroConfig = {
  eyebrow: string
  titulo: string
  subtitulo: string
  media_url?: string
  media_type?: 'image' | 'video'
  cta1_texto: string
  cta1_link: string
  cta2_texto: string
  cta2_link: string
  seo_title: string
  seo_description: string
}

export type NarrativaBloque = { titulo: string; texto: string }
export type NarrativaConfig = {
  eyebrow: string
  titulo: string
  bloques: NarrativaBloque[]
}

export type SedeConfig = {
  eyebrow: string
  titulo: string
  imagenes: string[]
  descripcion: string
  direccion: string
  coordenadas: string
  maps_link: string
}

export type CountdownConfig = {
  fecha_inicio: string
  eyebrow: string
}

export type FaccionV3 = {
  nombre: string
  imagen_url: string
  descripcion: string
  loadout: string
  contacto_nombre: string
  contacto_whatsapp: string
  agotada: boolean
}
export type FaccionesConfig = {
  eyebrow: string
  titulo: string
  facciones: FaccionV3[]
}

export type VentanaInscripcion = {
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  precio: string
  incluye: string[]
  estado: 'activa' | 'agotada' | 'proxima' | 'finalizada'
  cta_texto: string
  cta_link: string
}
export type InscripcionConfig = {
  eyebrow: string
  titulo: string
  nota: string
  ventanas: VentanaInscripcion[]
}

export type AmenidadesConfig = {
  eyebrow: string
  titulo: string
  items: string[]
}

export type CronogramaHito = {
  hora: string
  titulo: string
  descripcion: string
  nocturno: boolean
}
export type CronogramaConfig = {
  eyebrow: string
  titulo: string
  hitos: CronogramaHito[]
}

export type SponsorLogo = {
  nombre: string
  logo_url: string
  link: string
  tier: 'principal' | 'aliado' | 'patrocinador'
}
export type SponsorsConfig = {
  eyebrow: string
  titulo: string
  logos: SponsorLogo[]
}

export type GaleriaImagen = {
  url: string
  orientacion: 'vertical' | 'horizontal' | 'cuadrada'
}
export type GaleriaConfig = {
  eyebrow: string
  titulo: string
  imagenes: GaleriaImagen[]
}

export type VideoItem = {
  url: string
  poster?: string
  titulo?: string
}
export type VideosConfig = {
  eyebrow: string
  titulo: string
  videos: VideoItem[]
}

export type MusicaConfig = {
  eyebrow: string
  titulo: string
  artista: string
  audio_url: string
  cover_url: string
}

export type AirnationConfig = {
  eyebrow: string
  titulo: string
  descripcion: string
  cta_texto: string
  cta_link: string
}

export type Virus3Block = {
  id: string
  slug: Virus3Slug
  config: unknown
  activo: boolean
  orden: number
}
