import type { Metadata } from 'next'
import PublicSiteHeader from '@/components/layout/PublicSiteHeader'
import { getBloodMoney2Blocks, getHeroConfig } from './lib/get-blocks'
import { BlockRenderer } from './components/BlockRenderer'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const CANONICAL = 'https://www.airnation.online/bloodmoney2'

const DEFAULT_TITLE =
  'Op. Blood Money 2 — Airsoft Aguascalientes · 16 Mayo 2026 | AirNation'
const DEFAULT_DESCRIPTION =
  'El evento de airsoft más grande del año en México. 16–17 mayo 2026 en Aguascalientes. Cobertura oficial en AirNation.'
const DEFAULT_OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

function str(config: Record<string, unknown>, key: string): string {
  const v = config[key]
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : ''
}

export async function generateMetadata(): Promise<Metadata> {
  const blocks = await getBloodMoney2Blocks()
  const hero = getHeroConfig(blocks)

  const title = str(hero, 'seo_title') || DEFAULT_TITLE
  const description =
    (str(hero, 'seo_description') || DEFAULT_DESCRIPTION).slice(0, 160)
  const ogImage = str(hero, 'imagen_url') || DEFAULT_OG_IMAGE

  return {
    title,
    description,
    alternates: { canonical: CANONICAL },
    openGraph: {
      title,
      description,
      url: CANONICAL,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

function EventJsonLd({ heroImage }: { heroImage: string }) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Operación Blood Money 2',
    description:
      'El evento de airsoft más grande del año en México. 16–17 mayo 2026 en Aguascalientes.',
    startDate: '2026-05-16T11:00:00-06:00',
    endDate: '2026-05-17T14:00:00-06:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [heroImage],
    url: CANONICAL,
    location: {
      '@type': 'Place',
      name: 'Drinkinteam Gotcha',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Aguascalientes',
        addressRegion: 'Aguascalientes',
        addressCountry: 'MX',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Airsoft Experience México',
      url: 'https://www.airsoftexperiencemexico.com/',
    },
    sponsor: {
      '@type': 'Organization',
      name: 'AirNation',
      url: 'https://www.airnation.online',
    },
    offers: {
      '@type': 'Offer',
      url: 'https://www.airsoftexperiencemexico.com/bloodmoney',
      price: '1499.00',
      priceCurrency: 'MXN',
      availability: 'https://schema.org/InStock',
      validFrom: '2025-12-01T00:00:00-06:00',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  )
}

export default async function BloodMoney2Page() {
  const blocks = await getBloodMoney2Blocks()
  const hero = getHeroConfig(blocks)
  const heroImage = str(hero, 'imagen_url') || DEFAULT_OG_IMAGE

  const activeBlocks = blocks.filter((b) => b.activo)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PublicSiteHeader />
      <EventJsonLd heroImage={heroImage} />
      {activeBlocks.map((b) => (
        <BlockRenderer key={b.slug} block={b} />
      ))}
    </div>
  )
}
