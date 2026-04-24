import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";
import { getSiteAssets } from "@/lib/site-assets";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Crear cuenta — AirNation",
  description:
    "Crea tu cuenta gratis en AirNation. Obtén tu credencial digital, registra tu arsenal, únete a equipos y conecta con la comunidad airsoft en México.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.airnation.online/register" },
};

export default async function RegisterPage() {
  const assets = await getSiteAssets();
  const registerFotoUrl =
    assets["register_foto"] ?? "/images/register_foto.jpg";

  return <RegisterClient registerImageSrc={registerFotoUrl} />;
}
