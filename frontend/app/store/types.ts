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
