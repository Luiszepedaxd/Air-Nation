import type { Metadata } from 'next'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { LandingNav } from './components/LandingNav'
import { getBiohazard2Blocks } from './lib/get-blocks'
import { BlockRenderer } from './components/BlockRenderer'
import { offersDesdeVentanas, urlHttp } from './lib/ofertas'
import type { HeroConfig, InscripcionConfig, ProductorConfig } from './lib/types'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const CANONICAL = 'https://www.airnation.online/biohazard2'
const DEFAULT_OG_IMAGE = 'https://www.airnation.online/og-default.jpg'
const DEFAULT_TITLE =
  'Biohazard 2: Día Cero · 14–15 Nov 2026 · Selva Ojo de Halcón | AirNation'
const DEFAULT_DESCRIPTION =
  'Airsoft milsim: Alpha Group vs Delta Force en la selva Ojo de Halcón. Extrae la cepa original y somete al Soldado 0. Produce SPEAR Airsoft Productions.'

function heroOgShareUrl(cfg: HeroConfig | undefined): string {
  if (!cfg) return DEFAULT_OG_IMAGE
  const url = (cfg.media_url || '').trim()
  if (!url) return DEFAULT_OG_IMAGE
  if (cfg.media_type === 'video') return DEFAULT_OG_IMAGE
  return url
}

export async function generateMetadata(): Promise<Metadata> {
  const blocks = await getBiohazard2Blocks()
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

export default async function Biohazard2Page() {
  const blocks = await getBiohazard2Blocks()

  const heroBlock = blocks.find((b) => b.slug === 'hero')
  const heroConfig = heroBlock?.config as HeroConfig | undefined
  const heroImage = heroOgShareUrl(heroConfig)

  const inscripcion = blocks.find((b) => b.slug === 'inscripcion')?.config as
    | InscripcionConfig
    | undefined
  const offers = offersDesdeVentanas(inscripcion?.ventanas)

  const productor = blocks.find((b) => b.slug === 'productor')?.config as
    | ProductorConfig
    | undefined
  const organizerUrl = urlHttp(productor?.sitio)

  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const hasSession = !!session

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Biohazard 2: Día Cero',
    description: DEFAULT_DESCRIPTION,
    startDate: '2026-11-14T08:00:00-05:00',
    endDate: '2026-11-15T18:00:00-05:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: [heroImage],
    url: CANONICAL,
    location: {
      '@type': 'Place',
      name: 'Selva Ojo de Halcón — Instalaciones S.P.E.A.R.',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'Quintana Roo',
        addressCountry: 'MX',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'SPEAR Airsoft Productions',
      ...(organizerUrl ? { url: organizerUrl } : {}),
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
      <LandingNav hasSession={hasSession} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen w-full overflow-x-hidden bg-[#F5F3EF] text-[#111111]">
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
          visibleBlocks.map((block) => <BlockRenderer key={block.id} block={block} />)
        )}
      </main>
    </div>
  )
}
