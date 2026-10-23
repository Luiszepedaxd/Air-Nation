import type { Metadata } from 'next'
import {
  fetchArenaLandingMedia,
  fetchArenaMarketplace,
  filtrosDeSearchParams,
} from '@/lib/arena-marketplace'
import { MarketplaceClient } from './MarketplaceClient'

export const revalidate = 0

const ARENA_DESCRIPTION =
  'Reserva en línea tu día de airsoft, gotcha o gelsoft en México: elige campo y día, paga una sola vez y llega con tu QR. Precios desde, días disponibles y cancelación clara.'

export const metadata: Metadata = {
  // `absolute`: el layout raíz agrega "| AirNation" y aquí ya va en el título.
  title: { absolute: 'Reserva campos de airsoft y gotcha en México | AirNation ARENA' },
  description: ARENA_DESCRIPTION,
  // Canonical sin filtros: las combinaciones de filtros no se indexan aparte.
  alternates: { canonical: 'https://www.airnation.online/arena' },
  openGraph: {
    title: 'Reserva campos de airsoft y gotcha en México',
    description: ARENA_DESCRIPTION,
    url: 'https://www.airnation.online/arena',
    type: 'website',
  },
}

export default async function ArenaMarketplacePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const filtros = filtrosDeSearchParams(searchParams)
  const [marketplace, media] = await Promise.all([
    fetchArenaMarketplace(filtros),
    fetchArenaLandingMedia(),
  ])

  return (
    <MarketplaceClient
      inicial={marketplace}
      filtrosIniciales={filtros}
      hero={media.find((m) => m.slot === 'hero') ?? null}
      banners={media.filter((m) => m.slot !== 'hero')}
    />
  )
}
