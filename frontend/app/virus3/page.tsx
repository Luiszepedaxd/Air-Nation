import type { Metadata } from 'next'
import { LandingNav } from './components/LandingNav'
import { getVirus3Blocks } from './lib/get-blocks'
import { BlockRenderer } from './components/BlockRenderer'
import type { HeroConfig, MusicaConfig } from './lib/types'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const CANONICAL = 'https://www.airnation.online/virus3'
const DEFAULT_OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

const DEFAULT_TITLE =
  'Op. Virus 3 — Horror Táctico · 10–11 Oct 2026 | AirNation'
const DEFAULT_DESCRIPTION =
  'La experiencia más inmersiva de airsoft en México. 160 operadores, 4 facciones, hospital abandonado en San Luis Potosí.'

function heroOgShareUrl(cfg: HeroConfig | undefined): string {
  if (!cfg) return DEFAULT_OG_IMAGE
  const url = (cfg.media_url || '').trim()
  if (!url) return DEFAULT_OG_IMAGE
  if (cfg.media_type === 'video') return DEFAULT_OG_IMAGE
  return url
}

export async function generateMetadata(): Promise<Metadata> {
  const blocks = await getVirus3Blocks()
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

export default async function Virus3Page() {
  const blocks = await getVirus3Blocks()
  const renderedAt = new Date().toISOString()

  const heroBlock = blocks.find((b) => b.slug === 'hero')
  const heroConfig = heroBlock?.config as HeroConfig | undefined
  const heroImage = heroOgShareUrl(heroConfig)

  const musicaBlock = blocks.find((b) => b.slug === 'musica')
  const musicaConfig = musicaBlock?.config as MusicaConfig | undefined
  const audioUrl = musicaConfig?.audio_url?.trim() || undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Operación Virus 3',
    description: DEFAULT_DESCRIPTION,
    startDate: '2026-10-10',
    endDate: '2026-10-11',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [heroImage],
    url: CANONICAL,
    location: {
      '@type': 'Place',
      name: 'Hospital Abandonado',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'San Luis Potosí',
        addressCountry: 'MX',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'Airsoft Experience México',
    },
    sponsor: {
      '@type': 'Organization',
      name: 'AirNation',
      url: 'https://www.airnation.online',
    },
  }

  const visibleBlocks = blocks.filter((b) => b.activo)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#F5F3EF] text-[#111111]">
      <LandingNav audioUrl={audioUrl} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen w-full bg-[#F5F3EF] text-[#111111]">
        {visibleBlocks.length === 0 ? (
          <div className="flex min-h-[50vh] items-center justify-center px-4 pt-24 text-center">
            <p
              className="text-sm uppercase tracking-[0.2em] text-[#666666]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
            >
              Contenido del evento próximamente
            </p>
          </div>
        ) : (
          visibleBlocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              renderedAt={renderedAt}
            />
          ))
        )}
      </main>
    </div>
  )
}
