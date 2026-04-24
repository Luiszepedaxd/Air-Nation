import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteAssets } from "@/lib/site-assets";
import LoginClient from "./LoginClient";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Iniciar sesión — AirNation",
  description:
    "Accede a tu cuenta AirNation para ver tu credencial digital, arsenal, equipos y feed de la comunidad airsoft México.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.airnation.online/login" },
};

export default async function LoginPage() {
  const assets = await getSiteAssets();
  const loginFotoUrl = assets["login_foto"] ?? "/images/login_foto.jpg";

  return (
    <Suspense fallback={null}>
      <LoginClient loginFotoUrl={loginFotoUrl} />
    </Suspense>
  );
}
