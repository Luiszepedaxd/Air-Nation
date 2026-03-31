import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
