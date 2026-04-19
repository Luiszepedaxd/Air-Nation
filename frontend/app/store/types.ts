export type StoreProduct = {
  id: string
  nombre: string
  slug: string
  fotos_urls: string[]
  precio: number
  condicion: 'nuevo' | 'outlet'
  stock: number
  stock_visible: boolean
  destacado: boolean
  activo: boolean
  peso_kg: number | null
  largo_cm: number | null
  ancho_cm: number | null
  alto_cm: number | null
  brand_id: string | null
  categoria_id: string | null
}

export type StoreCategory = {
  id: string
  nombre: string
  slug: string
  parent_id: string | null
}

export type StoreBrand = {
  id: string
  nombre: string
  slug: string
  logo_url: string | null
}

export type HomepageBlockTipo =
  | 'hero'
  | 'banner1'
  | 'banner2'
  | 'promoBanner'
  | 'banner_producto'
  | 'categorias_grid'
  | 'carrusel_productos'
  | 'blog_destacado'
  | 'texto_libre'

export type HomepageBlock = {
  id: string
  tipo: HomepageBlockTipo
  orden: number
  activo: boolean
  config: Record<string, unknown>
}

export type HeroConfig = {
  imagen_url: string
  titulo: string
  subtitulo?: string
  cta_texto?: string
  cta_link?: string
}

export type BannerProductoConfig = {
  imagen_url: string
  marca?: string
  titulo: string
  descripcion?: string
  cta_link?: string
}

export type CategoriasGridConfig = {
  titulo_seccion?: string
  items: { categoria_id: string; imagen_url: string; label: string }[]
}

export type CarruselProductosConfig = {
  titulo_seccion: string
  product_ids: string[]
}

export type BlogDestacadoConfig = {
  post_id?: string
  imagen_url: string
  titulo: string
  extracto?: string
  cta_link?: string
}

export type TextoLibreConfig = {
  titulo?: string
  cuerpo: string
  bg_color?: string
  text_color?: string
}
