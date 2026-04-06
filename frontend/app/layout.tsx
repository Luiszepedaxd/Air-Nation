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
};

export const metadata: Metadata = {
  metadataBase: new URL("https://airnation.online"),
  alternates: {
    canonical: '/',
  },
  title: "AirNation — Plataforma central del airsoft",
  description:
    "Perfil de jugador, credencial digital, equipos, documentación oficial y registro de réplicas. La plataforma hecha por y para la comunidad de airsoft en México.",
  keywords: ["airsoft", "mexico", "gotcha", "paintball", "equipos", "replicas"],
  openGraph: {
    title: "AirNation",
    description: "La base del Airsoft en México",
    url: "https://airnation.online",
    siteName: "AirNation",
    locale: "es_MX",
    type: "website",
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
        {children}
        <GoogleAnalytics />
        <PwaRegister />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
