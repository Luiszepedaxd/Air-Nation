import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AirNation — La base del Airsoft en México",
  description:
    "Registra tu equipo, genera credenciales, documenta tus réplicas y accede a documentación oficial. La plataforma central del Airsoft, Gotcha y Paintball en México.",
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
