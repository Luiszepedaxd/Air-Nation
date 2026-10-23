export type Biohazard2Slug =
  | 'hero'
  | 'narrativa'
  | 'countdown'
  | 'mision'
  | 'soldado_cero'
  | 'facciones'
  | 'sede'
  | 'inscripcion'
  | 'cronograma'
  | 'reglamento'
  | 'productor'
  | 'sponsors'
  | 'galeria'
  | 'videos'
  | 'airnation'

export const BH2_SLUGS: readonly Biohazard2Slug[] = [
  'hero',
  'narrativa',
  'countdown',
  'mision',
  'soldado_cero',
  'facciones',
  'sede',
  'inscripcion',
  'cronograma',
  'reglamento',
  'productor',
  'sponsors',
  'galeria',
  'videos',
  'airnation',
] as const

export type HeroConfig = {
  eyebrow: string
  titulo: string
  subtitulo: string
  lema: string
  fecha_texto: string
  ubicacion_texto: string
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

export type CountdownConfig = {
  fecha_inicio: string
  eyebrow: string
}

export type ObjetivoMision = {
  codigo: string
  titulo: string
  descripcion: string
}
export type MisionConfig = {
  eyebrow: string
  titulo: string
  descripcion: string
  objetivos: ObjetivoMision[]
  cierre: string
}

export type DatoAmenaza = { label: string; valor: string }
export type SoldadoCeroConfig = {
  eyebrow: string
  titulo: string
  nombre_clave: string
  estado: string
  clasificacion: string
  imagen_url: string
  descripcion: string
  datos: DatoAmenaza[]
  advertencia: string
}

export type FaccionBH2 = {
  id: string
  nombre: string
  subtitulo: string
  pais: string
  bandera: string
  color: string
  comandante: string
  doctrina: string
  uniformidad: string[]
  descripcion: string
  imagen_url: string
  logo_url: string
  contacto_nombre: string
  contacto_whatsapp: string
  cupo_texto: string
  agotada: boolean
}
export type FaccionesConfig = {
  eyebrow: string
  titulo: string
  descripcion: string
  facciones: FaccionBH2[]
  nota: string
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

export type CronogramaHito = {
  dia: string
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

export type ReglamentoConfig = {
  eyebrow: string
  titulo: string
  reglas: string[]
  pie_pagina: string
}

export type ProductorConfig = {
  eyebrow: string
  titulo: string
  nombre: string
  logo_url: string
  descripcion: string
  instagram: string
  facebook: string
  whatsapp: string
  sitio: string
}

export type SponsorLogo = {
  nombre: string
  logo_url: string
  link: string
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

export type VideoItem = { url: string; poster?: string; titulo?: string }
export type VideosConfig = {
  eyebrow: string
  titulo: string
  videos: VideoItem[]
}

export type AirnationConfig = {
  eyebrow: string
  titulo: string
  descripcion: string
  cta_texto: string
  cta_link: string
}

export type Biohazard2Block = {
  id: string
  slug: Biohazard2Slug
  config: unknown
  activo: boolean
  orden: number
}
