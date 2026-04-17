import type { Metadata, Viewport } from "next";
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
  title: "AirNation — Plataforma central del airsoft",
  description:
    "Perfil de jugador, credencial digital, equipos, documentación oficial y registro de réplicas. La plataforma hecha por y para la comunidad de airsoft en México.",
  keywords: ["airsoft", "mexico", "gotcha", "paintball", "equipos", "replicas"],
  openGraph: {
    title: "AirNation",
    description: "La base del Airsoft en México",
    url: "https://www.airnation.online",
    siteName: "AirNation",
    locale: "es_MX",
    type: "website",
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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WM7G5HPX');`,
          }}
        />
        {/* End Google Tag Manager */}
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WM7G5HPX"
            height="0"
            width="0"
            title="Google Tag Manager"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'AirNation',
              url: 'https://www.airnation.online',
              logo: 'https://www.airnation.online/icons/icon-180.png',
              sameAs: [],
              knowsAbout: ['airsoft', 'paintball', 'milsim'],
              description:
                'Plataforma central del airsoft en México. Equipos, campos, eventos, credencial digital y registro de réplicas.',
              areaServed: 'MX',
              foundingDate: '2024',
            }),
          }}
        />
        {children}
        <GoogleAnalytics />
        <PwaRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
