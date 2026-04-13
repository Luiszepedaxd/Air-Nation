import type { Metadata } from 'next'

export const revalidate = 0;

import Navbar           from "@/components/landing/Navbar";
import Hero             from "@/components/landing/Hero";
import Features         from "@/components/landing/Features";
import ProductPreview   from "@/components/landing/ProductPreview";
import CommunitySection from "@/components/landing/CommunitySection";
import Footer           from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: 'AirNation — Plataforma central del airsoft en México',
  description:
    'Equipos, campos, eventos, credencial digital y registro de réplicas. La plataforma hecha por y para la comunidad de airsoft en México.',
  alternates: {
    canonical: 'https://www.airnation.online',
  },
  openGraph: {
    title: 'AirNation — Plataforma central del airsoft en México',
    description:
      'Equipos, campos, eventos, credencial digital y registro de réplicas. La plataforma hecha por y para la comunidad de airsoft en México.',
    url: 'https://www.airnation.online',
    type: 'website',
    images: [
      {
        url: 'https://www.airnation.online/og-default.jpg',
        width: 1200,
        height: 630,
      },
    ],
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
            url: 'https://www.airnation.online',
            description:
              'Plataforma central del airsoft en México. Equipos, campos, eventos y credencial digital.',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate:
                  'https://www.airnation.online/campos?ciudad={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <Navbar />
      <Hero />
      <Features />
      <ProductPreview />
      <CommunitySection />
      <Footer />
    </main>
  );
}
