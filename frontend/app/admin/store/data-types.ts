export type StoreAdminProductRow = Record<string, unknown>

export type StoreAdminCategoryRow = {
  id: string
  nombre: string
  slug: string
  parent_id: string | null
  activo: boolean
}

export type StoreAdminBrandRow = {
  id: string
  nombre: string
  slug: string
  activo: boolean
  logo_url: string | null
}
