import type { Metadata } from 'next'
import { LandingNav } from './components/LandingNav'
import { getMontanaDeNieblaBlocks } from './lib/get-blocks'
import { BlockRenderer } from './components/BlockRenderer'
import type { HeroConfig, InscripcionConfig, VentanaPrecio } from './lib/types'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const CANONICAL = 'https://www.airnation.online/montanadeniebla'
const DEFAULT_OG_IMAGE = 'https://www.airnation.online/og-default.jpg'

const DEFAULT_TITLE =
  'Op. Montaña de Niebla VII: Represalias · 10–11 Oct 2026 · Perote, Veracruz | AirNation'
const DEFAULT_DESCRIPTION =
  'Big Game con elementos milsim. Séptima edición. Dos facciones, un campo, una victoria. Ex Normal de Perote, Veracruz. Inscripciones desde $450 MXN preferente.'

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
    const base = {
      '@type': 'Offer',
      url: CANONICAL,
      priceCurrency: 'MXN',
      availability: 'https://schema.org/InStock',
      validFrom: v.fecha_desde,
      validThrough: v.fecha_hasta,
    }
    if (v.precio_general > 0) {
      offers.push({
        ...base,
        price: v.precio_general.toFixed(2),
        name: `${v.label} — General`,
      })
    }
    if (v.precio_preferente > 0) {
      offers.push({
        ...base,
        price: v.precio_preferente.toFixed(2),
        name: `${v.label} — Preferente`,
      })
    }
  }
  return offers
}

export async function generateMetadata(): Promise<Metadata> {
  const blocks = await getMontanaDeNieblaBlocks()
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

export default async function MontanaDeNieblaPage() {
  const blocks = await getMontanaDeNieblaBlocks()
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
    name: 'Operación Montaña de Niebla VII: Represalias',
    description: DEFAULT_DESCRIPTION,
    startDate: '2026-10-10T08:00:00-06:00',
    endDate: '2026-10-11T18:00:00-06:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [heroImage],
    url: CANONICAL,
    location: {
      '@type': 'Place',
      name: 'Ex Normal de Perote',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Perote',
        addressRegion: 'Veracruz',
        addressCountry: 'MX',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'LM Parches Tácticos',
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
    <div className="min-h-screen min-w-[375px] bg-[#F5F3EF] text-[#111111]">
      <LandingNav />
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
