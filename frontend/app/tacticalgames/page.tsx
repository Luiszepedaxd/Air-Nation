import type { Metadata } from 'next'
import { LandingNav } from './components/LandingNav'
import { getTacticalGamesBlocks } from './lib/get-blocks'
import { BlockRenderer } from './components/BlockRenderer'
import type { HeroConfig, InscripcionConfig, VentanaPrecio } from './lib/types'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const CANONICAL = 'https://www.airnation.online/tacticalgames'
const DEFAULT_OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

const DEFAULT_TITLE =
  'Airsoft Tactical Games México · 27-28 Jun 2026 · Metepec, Edo. Méx. | AirNation'
const DEFAULT_DESCRIPTION =
  'La primera competición táctica individual de airsoft en México. 27 y 28 de junio 2026 en Campo Gotcha Diablo, Metepec. Inscripciones desde $490 MXN.'

function heroOgShareUrl(cfg: HeroConfig | undefined): string {
  if (!cfg) return DEFAULT_OG_IMAGE
  const url = (cfg.media_url || '').trim()
  if (!url) return DEFAULT_OG_IMAGE
  if (cfg.media_type === 'video') return DEFAULT_OG_IMAGE
  return url
}

function normalizeVentanas(raw: unknown): VentanaPrecio[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  const ventanas = (raw as InscripcionConfig).ventanas
  if (!Array.isArray(ventanas)) return []
  return ventanas.filter(
    (v) =>
      v &&
      typeof v.fecha_desde === 'string' &&
      typeof v.fecha_hasta === 'string' &&
      typeof v.label === 'string'
  )
}

function buildJsonLdOffers(ventanas: VentanaPrecio[]) {
  const offers: Record<string, unknown>[] = []
  for (const v of ventanas) {
    if (!(Number(v.precio) > 0)) continue
    offers.push({
      '@type': 'Offer',
      url: CANONICAL,
      priceCurrency: 'MXN',
      price: Number(v.precio).toFixed(2),
      name: v.label,
      availability: 'https://schema.org/InStock',
      validFrom: v.fecha_desde,
      validThrough: v.fecha_hasta,
    })
  }
  return offers
}

export async function generateMetadata(): Promise<Metadata> {
  const blocks = await getTacticalGamesBlocks()
  const heroBlock = blocks.find((b) => b.slug === 'hero')
  const heroConfig = heroBlock?.config as HeroConfig | undefined

  const title = heroConfig?.seo_title?.trim() || DEFAULT_TITLE
  const description = heroConfig?.seo_description?.trim() || DEFAULT_DESCRIPTION
  const heroImage = heroOgShareUrl(heroConfig)

  return {
    title,
    description,
    alternates: { canonical: CANONICAL },
    openGraph: {
      title,
      description,
      url: CANONICAL,
      type: 'website',
      images: [{ url: heroImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [heroImage],
    },
  }
}

export default async function TacticalGamesPage() {
  const blocks = await getTacticalGamesBlocks()
  const renderedAt = new Date().toISOString()

  const heroBlock = blocks.find((b) => b.slug === 'hero')
  const heroConfig = heroBlock?.config as HeroConfig | undefined
  const heroImage = heroOgShareUrl(heroConfig)

  const inscripcionBlock = blocks.find((b) => b.slug === 'inscripcion')
  const ventanas = normalizeVentanas(inscripcionBlock?.config)
  const offers = buildJsonLdOffers(ventanas)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Airsoft Tactical Games México',
    description: DEFAULT_DESCRIPTION,
    startDate: '2026-06-27T09:00:00-06:00',
    endDate: '2026-06-28T18:00:00-06:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [heroImage],
    url: CANONICAL,
    location: {
      '@type': 'Place',
      name: 'Campo Gotcha Diablo',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Metepec',
        addressRegion: 'Estado de México',
        addressCountry: 'MX',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Airsoft Tactical Games México',
    },
    sponsor: {
      '@type': 'Organization',
      name: 'AirNation',
      url: 'https://www.airnation.online',
    },
    ...(offers.length > 0 ? { offers } : {}),
  }

  const visibleBlocks = blocks.filter((b) => b.activo)

  return (
    <div className="min-h-screen min-w-[360px]" style={{ backgroundColor: '#F5F0E6', color: '#1A1A1A' }}>
      <LandingNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen w-full">
        {visibleBlocks.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center px-4 pt-24 text-center">
            <p
              className="text-sm uppercase tracking-[0.2em]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6A6A5C' }}
            >
              Contenido del evento próximamente
            </p>
          </div>
        ) : (
          visibleBlocks.map((block) => (
            <BlockRenderer key={block.id} block={block} renderedAt={renderedAt} />
          ))
        )}
      </main>
    </div>
  )
}
