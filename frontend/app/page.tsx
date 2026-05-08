import type { Metadata } from 'next'

export const revalidate = 0;

import Navbar           from "@/components/landing/Navbar";
import Hero             from "@/components/landing/Hero";
import QueEsAirNation   from "@/components/landing/QueEsAirNation";
import ProximosEventosHome from "@/components/landing/ProximosEventosHome";
import CtaBandaUnete from "@/components/landing/CtaBandaUnete";
import CredencialHolografica from "@/components/landing/CredencialHolografica";
import BlogHome from "@/components/landing/BlogHome";
import CommunitySection from "@/components/landing/CommunitySection";
import ContactoSection  from "@/components/landing/ContactoSection";
import Footer           from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: 'AirNation — Plataforma del Airsoft en México',
  description:
    'Eventos, equipos, campos, marketplace y credencial digital del airsoft mexicano. Únete gratis a la comunidad airsoftera más grande de México.',
  keywords: [
    'airsoft méxico',
    'airsoft mexicano',
    'airsoft mx',
    'comunidad airsoft méxico',
    'plataforma airsoft méxico',
    'eventos airsoft méxico',
    'eventos airsoft 2026',
    'calendario airsoft méxico',
    'milsim méxico',
    'equipos de airsoft méxico',
    'campos de airsoft méxico',
    'marketplace airsoft méxico',
    'tienda airsoft méxico',
    'credencial airsoft',
    'registro replicas airsoft',
    'airsoft cdmx',
    'airsoft guadalajara',
    'airsoft monterrey',
    'gotcha méxico',
    'gelsoft méxico',
  ],
  alternates: {
    canonical: 'https://www.airnation.online',
  },
  openGraph: {
    title: 'AirNation — Plataforma del Airsoft en México',
    description:
      'Eventos, equipos, campos, marketplace y credencial digital del airsoft mexicano. Únete gratis a la comunidad airsoftera más grande de México.',
    url: 'https://www.airnation.online',
    siteName: 'AirNation',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: 'https://www.airnation.online/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'AirNation — Plataforma del Airsoft en México',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AirNation — Plataforma del Airsoft en México',
    description:
      'Eventos, equipos, campos, marketplace y credencial digital del airsoft mexicano. Únete gratis.',
    images: ['https://www.airnation.online/og-default.jpg'],
  },
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-an-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'AirNation',
            alternateName: 'AirNation México',
            url: 'https://www.airnation.online',
            description:
              'Plataforma del airsoft en México. Eventos, equipos, campos, marketplace, credencial digital y registro de réplicas.',
            inLanguage: 'es-MX',
            publisher: {
              '@type': 'Organization',
              name: 'AirNation',
              url: 'https://www.airnation.online',
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate:
                  'https://www.airnation.online/eventos?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <Navbar />
      <Hero />
      <QueEsAirNation />
      <ProximosEventosHome />
      <CtaBandaUnete />
      <CredencialHolografica />
      <BlogHome />
      <CommunitySection />
      <ContactoSection />
      <Footer />
    </main>
  );
}
