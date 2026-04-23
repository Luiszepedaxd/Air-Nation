export type BloodMoney2Slug =
  | 'hero'
  | 'ticker'
  | 'evento'
  | 'facciones'
  | 'logistica'
  | 'vip'
  | 'juggernaut'
  | 'entradas'
  | 'galeria'
  | 'airnation'
  | 'sponsors'
  | 'cta_final'

export const BM2_SLUGS: readonly BloodMoney2Slug[] = [
  'hero',
  'ticker',
  'evento',
  'facciones',
  'logistica',
  'vip',
  'juggernaut',
  'entradas',
  'galeria',
  'airnation',
  'sponsors',
  'cta_final',
] as const

export type BloodMoney2Block = {
  id: string | null
  slug: BloodMoney2Slug
  config: Record<string, unknown>
  activo: boolean
  orden: number
}
