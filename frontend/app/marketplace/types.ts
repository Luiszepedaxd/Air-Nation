export type PublicMarketplaceListing = {
  id: string
  titulo: string
  precio: number | null
  precio_original: number | null
  modalidad: 'fijo' | 'desde'
  supercategoria: string | null
  fotos_urls: string[]
  ciudad: string | null
  estado: string | null
  status: string
  vendido: boolean
  nuevo_usado: string
  created_at: string
}
