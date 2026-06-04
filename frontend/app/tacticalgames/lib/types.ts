export type TacticalGamesSlug =
  | 'hero'
  | 'briefing'
  | 'sede'
  | 'countdown'
  | 'equipamiento'
  | 'inscripcion'
  | 'sponsors'
  | 'galeria'
  | 'airnation'

export const TG_SLUGS: readonly TacticalGamesSlug[] = [
  'hero',
  'briefing',
  'sede',
  'countdown',
  'equipamiento',
  'inscripcion',
  'sponsors',
  'galeria',
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

export type BriefingConfig = {
  eyebrow: string
  titulo: string
  parrafos: string[]
  highlights: string[]
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

export type ItemEquipamiento = {
  nombre: string
  obligatorio: boolean
}

export type EquipamientoTab = {
  nombre: string
  items: ItemEquipamiento[]
}

export type EquipamientoConfig = {
  eyebrow: string
  titulo: string
  subtitulo: string
  tabs: EquipamientoTab[]
  nota_bbs: string
  nota_extra: string
}

export type VentanaPrecio = {
  fecha_desde: string
  fecha_hasta: string
  label: string
  precio: number
}

export type InscripcionConfig = {
  eyebrow: string
  titulo: string
  subtitulo: string
  ventanas: VentanaPrecio[]
  incluye: string[]
  nota: string
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

export type AirnationConfig = {
  eyebrow: string
  titulo: string
  descripcion: string
  cta_texto: string
  cta_link: string
}

export type TacticalGamesBlock = {
  id: string
  slug: TacticalGamesSlug
  config: unknown
  activo: boolean
  orden: number
}
