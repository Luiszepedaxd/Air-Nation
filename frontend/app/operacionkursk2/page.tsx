import type { Metadata } from 'next'
import { LandingNav } from './components/LandingNav'
import { getOperacionKursk2Blocks } from './lib/get-blocks'
import { BlockRenderer } from './components/BlockRenderer'
import type { HeroConfig } from './lib/types'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const CANONICAL = 'https://www.airnation.online/operacionkursk2'
const DEFAULT_OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

/** OG/Twitter necesitan imagen estática; si el hero es solo video, usar default. */
function heroOgShareUrl(cfg: HeroConfig | undefined): string {
  if (!cfg) return DEFAULT_OG_IMAGE
  const url = (cfg.media_url || cfg.imagen_fondo_url || '').trim()
  if (!url) return DEFAULT_OG_IMAGE
  if (cfg.media_type === 'video') return DEFAULT_OG_IMAGE
  return url
}

export async function generateMetadata(): Promise<Metadata> {
  const blocks = await getOperacionKursk2Blocks()
  const heroBlock = blocks.find((b) => b.slug === 'hero')
  const heroConfig = heroBlock?.config as HeroConfig | undefined

  const title =
    heroConfig?.seo_title ??
    'Operación Kursk II · 4 y 5 julio 2026 · Hacienda Misnébalam, Yucatán'
  const description =
    heroConfig?.seo_description ??
    'Evento de airsoft milsim en el pueblo fantasma de Hacienda Misnébalam, Yucatán. 12+ horas continuas. Preventa $700 hasta el 15 de mayo.'
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

export default async function OperacionKursk2Page() {
  const blocks = await getOperacionKursk2Blocks()
  const heroBlock = blocks.find((b) => b.slug === 'hero')
  const heroConfig = heroBlock?.config as HeroConfig | undefined
  const heroImage = heroOgShareUrl(heroConfig)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Operación Kursk II',
    description:
      'Evento de airsoft milsim por el XIII Aniversario del Club Toloks. 4 y 5 de julio de 2026 en Hacienda Misnébalam, Yucatán.',
    startDate: '2026-07-04T06:00:00-05:00',
    endDate: '2026-07-05T18:00:00-05:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [heroImage],
    url: CANONICAL,
    location: {
      '@type': 'Place',
      name: 'Hacienda Misnébalam',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Misnébalam',
        addressRegion: 'Yucatán',
        addressCountry: 'MX',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Toloks Club Airsoft',
    },
    sponsor: {
      '@type': 'Organization',
      name: 'AirNation',
      url: 'https://www.airnation.online',
    },
    offers: {
      '@type': 'Offer',
      url: CANONICAL,
      price: '700.00',
      priceCurrency: 'MXN',
      availability: 'https://schema.org/InStock',
      validFrom: '2026-04-01T00:00:00-05:00',
      validThrough: '2026-05-15T23:59:59-05:00',
    },
  }

  const visibleBlocks = blocks.filter((b) => b.activo)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#F5F3EF] text-[#111111]">
      <LandingNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen w-full bg-[#F5F3EF] text-[#111111]">
        {visibleBlocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </main>
    </div>
  )
}
