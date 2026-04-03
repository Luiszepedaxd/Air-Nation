import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
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
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
