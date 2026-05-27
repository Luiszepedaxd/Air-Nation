export type MontanaDeNieblaSlug =
  | 'hero'
  | 'narrativa'
  | 'sede'
  | 'countdown'
  | 'facciones'
  | 'puntos_victoria'
  | 'inscripcion'
  | 'sponsors'
  | 'manual'
  | 'galeria'
  | 'airnation'

export const MDN_SLUGS: readonly MontanaDeNieblaSlug[] = [
  'hero',
  'narrativa',
  'sede',
  'countdown',
  'facciones',
  'puntos_victoria',
  'inscripcion',
  'sponsors',
  'manual',
  'galeria',
  'airnation',
] as const

export type HeroConfig = {
  eyebrow: string
  titulo: string
  subtitulo: string
  media_url?: string
  media_type?: 'image' | 'video'
  simbolos: string[]
  cta1_texto: string
  cta1_link: string
  cta2_texto: string
  cta2_link: string
  seo_title: string
  seo_description: string
}

export type NarrativaBloque = { edicion: string; texto: string }
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

export type CodigoUniforme = {
  titulo: string
  permitidos: string[]
  prohibidos: string[]
}

export type FaccionMdN = {
  nombre: string
  imagen_url: string
  logo_url: string
  descripcion: string
  codigo_uniforme: CodigoUniforme
  contacto_nombre: string
  contacto_whatsapp: string
}

export type FaccionesConfig = {
  eyebrow: string
  titulo: string
  red_sun: FaccionMdN
  lux_et_umbra: FaccionMdN
  nota: string
}

export type CriterioPunto = {
  tipo: 'suma' | 'resta'
  texto: string
}

export type PuntosVictoriaConfig = {
  eyebrow: string
  titulo: string
  descripcion: string
  criterios: CriterioPunto[]
}

export type VentanaPrecio = {
  fecha_desde: string
  fecha_hasta: string
  label: string
  precio_general: number
  precio_preferente: number
}

export type InscripcionConfig = {
  eyebrow: string
  titulo: string
  subtitulo: string
  ventanas: VentanaPrecio[]
  nota_preferente: string
  nota_cambio_nombre: string
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

export type ManualConfig = {
  eyebrow: string
  titulo: string
  reglas: string[]
  pie_pagina: string
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

export type MontanaDeNieblaBlock = {
  id: string
  slug: MontanaDeNieblaSlug
  config: unknown
  activo: boolean
  orden: number
}
