import type { Metadata, Viewport } from "next";
import CapacitorBridge from "@/components/CapacitorBridge";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.airnation.online"),
  alternates: {
    canonical: 'https://www.airnation.online',
  },
  title: {
    default: "AirNation — Plataforma del Airsoft en México",
    template: "%s | AirNation",
  },
  description:
    "Eventos, equipos, campos, marketplace y credencial digital del airsoft mexicano. Únete gratis a la comunidad airsoftera más grande de México.",
  keywords: [
    "airsoft méxico",
    "airsoft mexicano",
    "comunidad airsoft méxico",
    "eventos airsoft méxico",
    "milsim méxico",
    "equipos de airsoft",
    "campos de airsoft",
    "marketplace airsoft",
    "credencial airsoft",
    "gotcha méxico",
    "gelsoft méxico",
  ],
  openGraph: {
    title: "AirNation — Plataforma del Airsoft en México",
    description: "La comunidad airsoftera más grande de México. Eventos, equipos, campos, marketplace y más.",
    url: "https://www.airnation.online",
    siteName: "AirNation",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "https://www.airnation.online/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "AirNation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AirNation — Plataforma del Airsoft en México",
    description: "La comunidad airsoftera más grande de México.",
    images: ["https://www.airnation.online/og-default.jpg"],
  },
  verification: {
    google: 'w4G4FX4FGEQaRBh4nnNMQDAHmAJdOHYVU57tpgGY6Fw',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
      window.__beforeInstallPrompt = null;
      window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        window.__beforeInstallPrompt = e;
      }, { once: true });
    `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#CC4B37" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AirNation" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'AirNation',
              alternateName: 'AirNation México',
              url: 'https://www.airnation.online',
              logo: 'https://www.airnation.online/icons/icon-180.png',
              sameAs: [
                'https://www.instagram.com/airnation_online',
                'https://www.facebook.com/share/1Gb9RJXiQ8/',
              ],
              knowsAbout: ['airsoft', 'paintball', 'milsim', 'gotcha', 'gelsoft'],
              description:
                'Plataforma central del airsoft en México. Eventos, equipos, campos, marketplace, credencial digital y registro de réplicas.',
              areaServed: {
                '@type': 'Country',
                name: 'México',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'info@airnation.online',
                contactType: 'customer support',
                availableLanguage: ['Spanish', 'es'],
              },
            }),
          }}
        />
        {children}
        <GoogleAnalytics />
        <CapacitorBridge />
        <PwaRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
