// Slug literal
export type OperacionKursk2Slug =
  | 'hero'
  | 'narrativa'
  | 'sede'
  | 'operativo'
  | 'countdown'
  | 'facciones'
  | 'inscripcion'
  | 'sponsors'
  | 'galeria'
  | 'videos'
  | 'manual'
  | 'airnation'

export const OK2_SLUGS: readonly OperacionKursk2Slug[] = [
  'hero',
  'narrativa',
  'sede',
  'operativo',
  'countdown',
  'facciones',
  'inscripcion',
  'sponsors',
  'galeria',
  'videos',
  'manual',
  'airnation',
] as const

// Configs por slug
export type HeroConfig = {
  eyebrow: string
  titulo: string
  subtitulo: string
  /** URL de imagen o video de fondo (vacío si solo hay legacy) */
  media_url?: string
  media_type?: 'image' | 'video'
  /** DEPRECATED — lectura solo retrocompat; usar media_url */
  imagen_fondo_url?: string
  banderas_animadas: boolean
  cta1_texto: string
  cta1_link: string
  cta2_texto: string
  cta2_link: string
  seo_title: string
  seo_description: string
}

export type NarrativaConfig = {
  eyebrow?: string
  bloques: Array<{ anio: string; texto: string }>
}

export type SedeConfig = {
  eyebrow: string
  titulo: string
  /** @deprecated Lectura retrocompat; preferir `imagenes` */
  imagen_url?: string
  imagenes?: string[]
  descripcion: string
  direccion: string
  coordenadas: string
  maps_link: string
}

export type CountdownConfig = {
  fecha_inicio: string // ISO
  eyebrow: string
}

export type FaccionUniforme = { nombre: string; hex: string }
export type FaccionData = {
  nombre: string
  imagen_url: string
  descripcion: string
  uniformes: FaccionUniforme[]
  contacto_nombre: string
  contacto_whatsapp: string
}
export type FaccionesConfig = {
  eyebrow: string
  titulo: string
  rusa: FaccionData
  ucraniana: FaccionData
  nota: string
}

export type OperativoHito = {
  hora: string
  titulo: string
  descripcion: string
  nocturno: boolean
  /** Opcional, ej. "ALFA-1", "BRAVO-2", "TODAS" */
  unidad?: string
}
export type OperativoConfig = {
  eyebrow: string
  titulo: string
  hitos: OperativoHito[]
}

export type InscripcionConfig = {
  eyebrow: string
  titulo: string
  precio: string
  fecha_limite: string
  subtitulo: string
  cta1_texto: string
  cta1_link: string
  cta2_texto: string
  cta2_link: string
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

export type ManualConfig = {
  eyebrow: string
  titulo: string
  reglas: string[]
}

export type AirnationConfig = {
  eyebrow: string
  titulo: string
  descripcion: string
  cta_texto: string
  cta_link: string
}

// Bloque genérico
export type OperacionKursk2Block = {
  id: string
  slug: OperacionKursk2Slug
  config: unknown // narrowed por slug en componentes
  activo: boolean
  orden: number
}
